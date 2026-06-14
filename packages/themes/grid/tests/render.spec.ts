import { describe, expect, it } from 'vitest';

import grid, { meta } from '../src/index.js';

import type { NormalizedFeed } from '@perch/core';

const feed: NormalizedFeed = {
  source: { url: 'https://example.com/feed' },
  fetchedAt: '2026-05-01T00:00:00.000Z',
  items: [
    {
      id: '1',
      url: 'https://example.com/p/1',
      title: 'one',
      publishedAt: '2026-04-30T00:00:00.000Z',
      source: { url: 'https://example.com/feed' },
    },
  ],
};

describe('@perch/theme-grid', () => {
  it('declares the documented metadata', () => {
    expect(meta).toMatchObject({ id: 'grid', displayName: { ja: 'グリッド', en: 'Grid' } });
  });

  it('renders ja + en snapshots', () => {
    const profile = { displayName: 'grid sample' };
    expect(grid.render({ profile, feed, locale: 'ja' })).toMatchSnapshot('ja');
    expect(grid.render({ profile, feed, locale: 'en' })).toMatchSnapshot('en');
  });
});
