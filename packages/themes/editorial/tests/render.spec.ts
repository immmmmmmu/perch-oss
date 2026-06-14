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
        { label: 'GitHub', href: 'https://github.com/example' },
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
});
