import { describe, expect, it } from 'vitest';

import { parseFeed, UnsupportedFeedError, type FeedSource } from '../../src/index.js';

const source: FeedSource = { url: 'https://example.com/feed' };
const RSS_PERFORMANCE_ATTEMPTS = 3;
const RSS_CI_SMOKE_THRESHOLD_MS = 500;

const RSS_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Example Blog</title>
    <link>https://example.com/</link>
    <language>ja</language>
    <item>
      <title>Hello &amp; world</title>
      <link>https://example.com/posts/1</link>
      <guid>post-1</guid>
      <pubDate>Wed, 30 Apr 2026 10:00:00 +0900</pubDate>
      <description>&lt;p&gt;intro&lt;/p&gt;</description>
      <author>alice@example.com</author>
    </item>
    <item>
      <title>No date here</title>
      <link>https://example.com/posts/2</link>
    </item>
  </channel>
</rss>`;

const ATOM_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>Atom Sample</title>
  <link href="https://example.com/atom" rel="self"/>
  <entry xml:lang="en">
    <id>tag:example,2026:1</id>
    <title>Atom item one</title>
    <link href="https://example.com/atom/1" rel="alternate"/>
    <published>2026-04-29T08:00:00Z</published>
    <updated>2026-04-29T09:00:00Z</updated>
    <summary>summary one</summary>
    <author><name>Bob</name></author>
  </entry>
</feed>`;

const JSON_FEED_FIXTURE = JSON.stringify({
  version: 'https://jsonfeed.org/version/1.1',
  title: 'JSON Feed sample',
  language: 'ja',
  items: [
    {
      id: 'jf-1',
      url: 'https://example.com/jf/1',
      title: 'JSON 1',
      content_text: '<b>hi</b>',
      date_published: '2026-04-28T00:00:00Z',
      authors: [{ name: 'Carol' }],
    },
    {
      id: 'jf-2',
      title: 'missing url',
      date_published: '2026-04-28T00:00:00Z',
    },
  ],
});

describe('parseFeed', () => {
  it('parses RSS 2.0, decodes entities, drops items missing required fields', () => {
    const result = parseFeed(RSS_FIXTURE, source);
    expect(result.feed.items).toHaveLength(1);
    expect(result.dropped).toHaveLength(1);
    const item = result.feed.items[0]!;
    expect(item.title).toBe('Hello & world');
    expect(item.url).toBe('https://example.com/posts/1');
    expect(item.summary).toBe('intro');
    expect(item.id).toBe('post-1');
    expect(item.locale).toBe('ja');
    expect(item.publishedAt).toBe('2026-04-30T01:00:00.000Z');
    expect(result.dropped[0]?.reason).toContain('publishedAt');
  });

  it('parses Atom 1.0', () => {
    const result = parseFeed(ATOM_FIXTURE, source);
    expect(result.feed.items).toHaveLength(1);
    const item = result.feed.items[0]!;
    expect(item.title).toBe('Atom item one');
    expect(item.url).toBe('https://example.com/atom/1');
    expect(item.summary).toBe('summary one');
    expect(item.authors).toEqual(['Bob']);
    expect(item.locale).toBe('en');
    expect(item.publishedAt).toBe('2026-04-29T08:00:00.000Z');
  });

  it('parses JSON Feed 1.1', () => {
    const result = parseFeed(JSON_FEED_FIXTURE, source);
    expect(result.feed.items).toHaveLength(1);
    const item = result.feed.items[0]!;
    expect(item.summary).toBe('hi');
    expect(item.authors).toEqual(['Carol']);
    expect(item.locale).toBe('ja');
    expect(result.dropped[0]?.reason).toContain('url');
  });

  it('throws UnsupportedFeedError for unknown XML root', () => {
    expect(() => parseFeed('<unknown>x</unknown>', source)).toThrow(UnsupportedFeedError);
  });

  it('throws UnsupportedFeedError for empty body', () => {
    expect(() => parseFeed('   ', source)).toThrow(UnsupportedFeedError);
  });

  it('falls back to FNV hash when no guid/id', () => {
    const xml = `<rss version="2.0"><channel><title>x</title>
      <item><title>t</title><link>https://example.com/n</link>
        <pubDate>Wed, 30 Apr 2026 10:00:00 +0900</pubDate></item>
    </channel></rss>`;
    const result = parseFeed(xml, source);
    expect(result.feed.items[0]?.id.startsWith('urlhash:')).toBe(true);
  });

  it('keeps 100KB RSS parsing within the CI smoke threshold', () => {
    const items = Array.from(
      { length: 600 },
      (_, i) => `
      <item>
        <title>Title ${String(i)}</title>
        <link>https://example.com/p/${String(i)}</link>
        <guid>g-${String(i)}</guid>
        <pubDate>Wed, 30 Apr 2026 10:00:00 +0900</pubDate>
        <description>summary text for item number ${String(i)} that is reasonably long.</description>
      </item>`,
    ).join('\n');
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>large</title>${items}</channel></rss>`;
    const sizeKb = Math.round(xml.length / 1024);
    let result: ReturnType<typeof parseFeed> | undefined;
    const timings = Array.from({ length: RSS_PERFORMANCE_ATTEMPTS }, () => {
      const start = performance.now();
      result = parseFeed(xml, source);
      return performance.now() - start;
    });
    const bestElapsed = Math.min(...timings);

    if (!result) throw new Error('performance smoke did not run parseFeed');
    expect(result.feed.items).toHaveLength(600);
    // Use the best short attempt so transient runner contention does not fail CI.
    // This remains a coarse regression smoke, not a microbenchmark.
    expect(bestElapsed).toBeLessThan(RSS_CI_SMOKE_THRESHOLD_MS);
    expect(sizeKb).toBeGreaterThan(100);
  });
});
