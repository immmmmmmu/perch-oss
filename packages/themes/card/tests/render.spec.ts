import { describe, expect, it } from 'vitest';

import card, { meta } from '../src/index.js';

import type { NormalizedFeed } from '@perch/core';

const feed: NormalizedFeed = {
  source: { url: 'https://example.com/feed' },
  fetchedAt: '2026-05-01T00:00:00.000Z',
  items: [],
};

describe('@perch/theme-card', () => {
  it('declares the documented metadata', () => {
    expect(meta).toMatchObject({ id: 'card', plan: 'free' });
  });

  it('renders ja + en snapshots', () => {
    const profile = { displayName: 'card sample', bio: '短い自己紹介' };
    expect(card.render({ profile, feed, locale: 'ja' })).toMatchSnapshot('ja');
    expect(card.render({ profile, feed, locale: 'en' })).toMatchSnapshot('en');
  });
});
