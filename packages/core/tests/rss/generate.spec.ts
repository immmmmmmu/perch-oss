import { describe, expect, it } from 'vitest';

import { generateRss } from '../../src/rss/generate.js';

import type { Post } from '../../src/post/index.js';

const samplePost: Post = {
  slug: 'hello',
  locale: 'ja',
  title: 'Hello & World <welcome>',
  publishedAt: '2026-05-12',
  tags: [],
  draft: false,
  bodyHtml: '<p>body & rest</p>',
  excerpt: 'body & rest',
  description: 'short summary',
  sourcePath: './posts/hello.md',
};

const opts = {
  profileUrl: 'https://imds.perch.app',
  feedTitle: 'Imai Yutaro',
  feedDescription: 'Latest posts from Imai Yutaro',
  language: 'ja' as const,
};

describe('generateRss', () => {
  it('emits a valid <rss version="2.0"> root', () => {
    const xml = generateRss([samplePost], opts);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('</rss>');
  });

  it('includes channel metadata', () => {
    const xml = generateRss([samplePost], opts);
    expect(xml).toContain('<title>Imai Yutaro</title>');
    expect(xml).toContain('<link>https://imds.perch.app</link>');
    expect(xml).toContain('<language>ja</language>');
  });

  it('escapes XML special characters in titles and content', () => {
    const xml = generateRss([samplePost], opts);
    expect(xml).toContain('Hello &amp; World &lt;welcome&gt;');
    expect(xml).not.toContain('Hello & World <welcome>');
  });

  it('outputs an empty channel when posts are empty', () => {
    const xml = generateRss([], opts);
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
  });

  it('emits item link as full url including profileUrl', () => {
    const xml = generateRss([samplePost], opts);
    expect(xml).toContain('<link>https://imds.perch.app/posts/hello</link>');
  });

  it('uses RFC 822 dates for pubDate', () => {
    const xml = generateRss([samplePost], opts);
    // 2026-05-12 -> Tue, 12 May 2026 ...
    expect(xml).toMatch(
      /<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} 2026 \d{2}:\d{2}:\d{2} GMT<\/pubDate>/,
    );
  });
});
