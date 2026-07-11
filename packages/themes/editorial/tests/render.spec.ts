import { describe, expect, it } from 'vitest';

import editorial, { meta } from '../src/index.js';

import type { NormalizedFeed } from '@perch/core';

const feed: NormalizedFeed = {
  source: { url: 'https://example.com/feed', name: 'Example Journal' },
  fetchedAt: '2026-05-01T00:00:00.000Z',
  items: [
    {
      id: '1',
      url: 'https://example.com/p/1',
      title: 'Designing a living profile page',
      publishedAt: '2026-04-30T00:00:00.000Z',
      summary: 'How a profile page can stay current without becoming another dashboard.',
      ogImageUrl: 'https://example.com/og/profile.png',
      source: { url: 'https://example.com/feed', name: 'Example Journal' },
    },
    {
      id: '2',
      url: 'https://zenn.dev/example/articles/perch',
      title: 'Static feeds for independent publishing',
      publishedAt: '2026-04-28T00:00:00.000Z',
      source: { url: 'https://zenn.dev/example/feed', name: 'Zenn' },
    },
  ],
};

describe('@perch/theme-editorial', () => {
  it('declares the documented metadata', () => {
    expect(meta).toMatchObject({
      id: 'editorial',
      displayName: { ja: 'エディトリアル', en: 'Editorial' },
    });
  });

  it('renders ja + en snapshots', () => {
    const profile = {
      displayName: 'Aoi Tanaka',
      bio: 'Independent editor and product writer exploring tools for people who publish in public.',
      avatarUrl: './avatar.png',
      links: [
        { label: 'Newsletter', href: 'https://example.com/newsletter' },
        {
          label: 'Substack dispatches for independent publishing teams',
          href: 'https://example.com/substack',
        },
        { label: 'GitHub', href: 'https://github.com/example' },
        { label: 'Company', href: 'https://example.com/company' },
      ],
    };
    expect(editorial.render({ profile, feed, locale: 'ja' })).toMatchSnapshot('ja');
    expect(editorial.render({ profile, feed, locale: 'en' })).toMatchSnapshot('en');
  });

  it('renders rich profile markdown and social link descriptions', () => {
    const profile = {
      displayName: 'Aoi Tanaka',
      bioHtml:
        '<p>I write about <strong>independent publishing</strong>.</p>\n<ul><li>note</li><li>Zenn</li></ul>',
      links: [
        {
          label: 'Newsletter',
          href: 'https://example.com/newsletter',
          description: 'Monthly notes and essays.',
        },
      ],
    };

    const html = editorial.render({ profile, feed, locale: 'en' });

    expect(html).toContain('<strong>independent publishing</strong>');
    expect(html).toContain('Monthly notes and essays.');
    expect(html).toContain('Profile links');
  });

  it('keeps long Japanese titles and many profile links inside editorial layout bounds', () => {
    const html = editorial.render({
      profile: {
        displayName: '長いプロフィール名でも折り返して読みやすい発信者',
        links: [
          { label: 'note', href: 'https://note.com/example' },
          { label: 'Substack', href: 'https://substack.com/@example' },
          { label: 'X (Twitter)', href: 'https://x.com/example' },
          { label: 'here-now (会社)', href: 'https://example.com/company' },
          {
            label: 'とても長いリンク名でも壊れないプロフィールリンク',
            href: 'https://example.com/very-long-link',
          },
        ],
      },
      feed: {
        source: { url: 'https://example.com/feed', name: 'note 記事' },
        fetchedAt: '2026-05-01T00:00:00.000Z',
        items: [
          {
            id: 'jp-1',
            url: 'https://example.com/articles/jp-1',
            title: 'AI時代の開発組織における問いの設計とレビュー文化をめぐる長い日本語タイトル',
            publishedAt: '2026-04-30T00:00:00.000Z',
            summary: '長い抜粋でも本文列の幅に収まることを確認するためのサマリーです。',
            source: { url: 'https://example.com/feed', name: 'note 記事' },
          },
          {
            id: 'jp-2',
            url: 'https://example.com/articles/jp-2',
            title: 'OGP画像つきの記事',
            publishedAt: '2026-04-29T00:00:00.000Z',
            ogImageUrl: 'https://example.com/og.png',
            source: { url: 'https://example.com/feed', name: 'note 記事' },
          },
        ],
      },
      locale: 'ja',
    });

    expect(html).toContain('perch-editorial-title');
    expect(html).toContain('sm:grid-cols-2 lg:grid-cols-1');
    expect(html).toContain('sm:grid-cols-[minmax(0,1fr)_13rem]');
    expect(html).toContain('AI時代の開発組織における問いの設計');
  });
});
