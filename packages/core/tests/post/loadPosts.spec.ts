import { describe, expect, it } from 'vitest';

import { loadPosts } from '../../src/post/loadPosts.js';

import type { PerchConfig } from '../../src/config/index.js';

const baseConfig: PerchConfig = {
  profile: { name: 'X' },
  locale: 'ja',
  theme: 'editorial',
  feeds: [],
  posts: {
    enabled: true,
    dir: './posts',
    assetsDir: './assets',
    perPage: 10,
    showInTimeline: true,
  },
};

function makePost(
  name: string,
  fm: Record<string, unknown>,
  body = 'body',
): { path: string; content: string } {
  const fmStr = Object.entries(fm)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : String(v)}`)
    .join('\n');
  return {
    path: `./posts/${name}`,
    content: `---\n${fmStr}\n---\n\n${body}`,
  };
}

describe('loadPosts', () => {
  it('returns posts sorted by publishedAt desc', async () => {
    const result = await loadPosts(
      [
        makePost('2026-05-01-old.md', { title: 'Old', publishedAt: '2026-05-01' }),
        makePost('2026-05-12-new.md', { title: 'New', publishedAt: '2026-05-12' }),
      ],
      baseConfig,
    );
    expect(result.posts.map((p) => p.slug)).toEqual(['new', 'old']);
    expect(result.errors).toEqual([]);
  });

  it('derives slug from filename when frontmatter has no slug', async () => {
    const result = await loadPosts(
      [makePost('2026-05-12-hello-world.md', { title: 'X', publishedAt: '2026-05-12' })],
      baseConfig,
    );
    expect(result.posts[0]!.slug).toBe('hello-world');
  });

  it('respects explicit frontmatter slug', async () => {
    const result = await loadPosts(
      [
        makePost('2026-05-12-anything.md', {
          title: 'X',
          publishedAt: '2026-05-12',
          slug: 'custom-slug',
        }),
      ],
      baseConfig,
    );
    expect(result.posts[0]!.slug).toBe('custom-slug');
  });

  it('derives locale from filename suffix .en.md', async () => {
    const result = await loadPosts(
      [makePost('2026-05-12-hello.en.md', { title: 'X', publishedAt: '2026-05-12' })],
      baseConfig,
    );
    expect(result.posts[0]!.locale).toBe('en');
  });

  it('falls back to config.locale when no other locale hint', async () => {
    const result = await loadPosts(
      [makePost('2026-05-12-hello.md', { title: 'X', publishedAt: '2026-05-12' })],
      baseConfig,
    );
    expect(result.posts[0]!.locale).toBe('ja');
  });

  it('excludes drafts (frontmatter)', async () => {
    const result = await loadPosts(
      [makePost('2026-05-12-x.md', { title: 'X', publishedAt: '2026-05-12', draft: true })],
      baseConfig,
    );
    expect(result.posts).toHaveLength(0);
  });

  it('excludes files prefixed with _', async () => {
    const result = await loadPosts(
      [makePost('_2026-05-12-x.md', { title: 'X', publishedAt: '2026-05-12' })],
      baseConfig,
    );
    expect(result.posts).toHaveLength(0);
  });

  it('records error and skips a malformed post but keeps the rest', async () => {
    const result = await loadPosts(
      [
        { path: './posts/broken.md', content: '---\nno-title: true\n---\nbody' },
        makePost('2026-05-12-good.md', { title: 'Good', publishedAt: '2026-05-12' }),
      ],
      baseConfig,
    );
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]!.slug).toBe('good');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.sourcePath).toBe('./posts/broken.md');
  });

  it('renders bodyHtml using markdown by default', async () => {
    const result = await loadPosts(
      [
        {
          path: './posts/2026-05-12-x.md',
          content: '---\ntitle: X\npublishedAt: 2026-05-12\n---\n\n# Heading\n\npara',
        },
      ],
      baseConfig,
    );
    expect(result.posts[0]!.bodyHtml).toContain('<h1>Heading</h1>');
  });

  it('renders bodyHtml using HTML sanitizer when format=html', async () => {
    const result = await loadPosts(
      [
        {
          path: './posts/2026-05-12-x.md',
          content:
            '---\ntitle: X\npublishedAt: 2026-05-12\nformat: html\n---\n\n<p><strong>raw</strong> <script>x</script></p>',
        },
      ],
      baseConfig,
    );
    expect(result.posts[0]!.bodyHtml).toContain('<strong>raw</strong>');
    expect(result.posts[0]!.bodyHtml).not.toMatch(/<script/i);
  });

  it('falls back to first paragraph for excerpt when description is missing', async () => {
    const result = await loadPosts(
      [
        {
          path: './posts/2026-05-12-x.md',
          content: '---\ntitle: X\npublishedAt: 2026-05-12\n---\n\nFirst sentence. Second one.',
        },
      ],
      baseConfig,
    );
    expect(result.posts[0]!.excerpt).toContain('First sentence');
  });
});
