import { describe, expect, it } from 'vitest';

import theme from '../src/index.js';

import type { PostPageContext, ThemeContext } from '@perch/themes-shared';

const baseCtx: ThemeContext = {
  profile: { displayName: 'Test' },
  feed: { source: { url: 'http://x' }, items: [], fetchedAt: '2026-05-12T00:00:00Z' },
  locale: 'ja',
  site: { url: 'https://test.perch.app' },
  posts: [
    {
      slug: 'hello',
      locale: 'ja',
      title: 'Hello',
      publishedAt: '2026-05-12',
      tags: [],
      draft: false,
      bodyHtml: '<p>body</p>',
      excerpt: 'body',
      sourcePath: './posts/hello.md',
    },
  ],
};

describe('grid theme posts integration', () => {
  it('renders perch posts mixed into the timeline', () => {
    const html = theme.render(baseCtx);
    expect(html).toContain('Hello');
  });

  it('renderPostsIndexPage outputs the posts heading', () => {
    const html = theme.renderPostsIndexPage!(baseCtx);
    expect(html).toContain('記事');
    expect(html).toContain('Hello');
  });

  it('renderPostPage outputs the article body html as-is (already sanitized)', () => {
    const postCtx: PostPageContext = {
      profile: baseCtx.profile,
      site: baseCtx.site,
      locale: 'ja',
      post: baseCtx.posts![0]!,
    };
    const html = theme.renderPostPage!(postCtx);
    expect(html).toContain('<p>body</p>');
  });

  it('renderFeedXml outputs a valid rss skeleton', () => {
    const xml = theme.renderFeedXml!(baseCtx);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('Hello');
  });
});
