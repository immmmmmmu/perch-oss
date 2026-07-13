import { describe, expect, it } from 'vitest';

import timeline, { meta } from '../src/index.js';

import type { NormalizedFeed } from '@perch-app/core';

const feed: NormalizedFeed = {
  source: { url: 'https://example.com/feed' },
  fetchedAt: '2026-05-01T00:00:00.000Z',
  items: [
    {
      id: '1',
      url: 'https://example.com/p/old',
      title: 'older post',
      publishedAt: '2026-04-01T00:00:00.000Z',
      source: { url: 'https://example.com/feed' },
    },
    {
      id: '2',
      url: 'https://example.com/p/new',
      title: 'newer post',
      publishedAt: '2026-04-30T00:00:00.000Z',
      source: { url: 'https://example.com/feed' },
    },
  ],
};

describe('@perch-app/theme-timeline', () => {
  it('declares the documented metadata', () => {
    expect(meta).toMatchObject({
      id: 'timeline',
      displayName: { ja: 'タイムライン', en: 'Timeline' },
    });
  });

  it('renders ja + en snapshots and orders feed entries by publishedAt desc', () => {
    const profile = { displayName: 'timeline sample' };
    const html = timeline.render({ profile, feed, locale: 'ja' });
    expect(html).toMatchSnapshot('ja');
    expect(html.indexOf('newer post')).toBeLessThan(html.indexOf('older post'));
    expect(timeline.render({ profile, feed, locale: 'en' })).toMatchSnapshot('en');
  });
});
