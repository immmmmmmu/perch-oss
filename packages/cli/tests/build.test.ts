import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { runBuild } from '../src/commands/build.js';

import type { PerchConfig } from '../src/config-loader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'perch-build-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const makeConfig = (overrides: Partial<PerchConfig> = {}): PerchConfig => ({
  profile: { name: 'Test User', bio: 'A tester' },
  locale: 'ja',
  theme: 'minimal',
  feeds: [],
  posts: {
    enabled: false,
    dir: './posts',
    assetsDir: './assets',
    perPage: 10,
    showInTimeline: true,
  },
  ...overrides,
});

describe('runBuild', () => {
  it('creates dist/index.html in outDir', async () => {
    const outDir = join(tmpDir, 'dist');
    const config = makeConfig();
    await runBuild({ config, outDir, cacheDir: join(tmpDir, '.perch/cache') });
    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
  });

  it('includes profile name in generated HTML', async () => {
    const outDir = join(tmpDir, 'dist');
    const config = makeConfig({ profile: { name: 'Alice', bio: 'Hello' } });
    await runBuild({ config, outDir, cacheDir: join(tmpDir, '.perch/cache') });
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('Alice');
  });

  it('includes feed items from custom source in HTML', async () => {
    const outDir = join(tmpDir, 'dist');

    const mockFetch: typeof fetch = (url) => {
      const u = url instanceof URL ? url.href : url instanceof Request ? url.url : url;
      if (u.includes('feed.xml')) {
        return Promise.resolve(
          new Response(
            `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>My Blog</title>
  <item>
    <title>Hello World Post</title>
    <link>https://example.com/hello</link>
    <pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate>
  </item>
</channel></rss>`,
            { headers: { 'Content-Type': 'application/rss+xml' } },
          ),
        );
      }
      return Promise.resolve(new Response('', { status: 404 }));
    };

    const config = makeConfig({
      feeds: [{ url: 'https://example.com/feed.xml', name: 'My Blog' }],
    });

    await runBuild({
      config,
      outDir,
      cacheDir: join(tmpDir, '.perch/cache'),
      fetchImpl: mockFetch,
    });

    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('Hello World Post');
  });

  it('hydrates missing feed images from article Open Graph metadata', async () => {
    const outDir = join(tmpDir, 'dist');

    const mockFetch: typeof fetch = (url) => {
      const u = url instanceof URL ? url.href : url instanceof Request ? url.url : url;
      if (u === 'https://example.com/feed.xml') {
        return Promise.resolve(
          new Response(
            `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>My Blog</title>
  <item>
    <title>Post With OGP</title>
    <link>https://example.com/post-with-ogp</link>
    <pubDate>Mon, 01 Jan 2026 00:00:00 GMT</pubDate>
  </item>
</channel></rss>`,
            { headers: { 'Content-Type': 'application/rss+xml' } },
          ),
        );
      }
      if (u === 'https://example.com/post-with-ogp') {
        return Promise.resolve(
          new Response(
            `<!doctype html><html><head>
<meta property="og:image" content="https://cdn.example.com/post.png" />
</head><body>Post</body></html>`,
            { headers: { 'Content-Type': 'text/html' } },
          ),
        );
      }
      return Promise.resolve(new Response('', { status: 404 }));
    };

    const config = makeConfig({
      theme: 'editorial',
      feeds: [{ url: 'https://example.com/feed.xml', name: 'My Blog' }],
    });

    await runBuild({
      config,
      outDir,
      cacheDir: join(tmpDir, '.perch/cache'),
      fetchImpl: mockFetch,
    });

    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('https://cdn.example.com/post.png');
  });

  it('generates HTML even when all feeds fail', async () => {
    const outDir = join(tmpDir, 'dist');
    const failingFetch: typeof fetch = () => Promise.resolve(new Response('', { status: 500 }));
    const config = makeConfig({
      feeds: [{ url: 'https://example.com/bad.xml', name: 'Bad Feed' }],
    });

    await runBuild({
      config,
      outDir,
      cacheDir: join(tmpDir, '.perch/cache'),
      fetchImpl: failingFetch,
    });

    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
  });
});
