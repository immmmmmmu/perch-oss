import { describe, expect, it } from 'vitest';

import minimal, { meta } from '../src/index.js';

import type { NormalizedFeed } from '@perch/core';
import type { ThemeContext } from '@perch/themes-shared';

const feed: NormalizedFeed = {
  source: { url: 'https://example.com/feed' },
  fetchedAt: '2026-05-01T00:00:00.000Z',
  items: [
    {
      id: '1',
      url: 'https://example.com/p/1',
      title: 'こんにちは <world>',
      publishedAt: '2026-04-30T00:00:00.000Z',
      summary: 'intro &amp; preview',
      source: { url: 'https://example.com/feed' },
    },
  ],
};

const ctxBase: Omit<ThemeContext, 'locale'> = {
  profile: {
    displayName: '今田 慎一郎',
    bio: 'DX 支援',
    links: [{ label: 'Blog', href: 'https://example.com/' }],
  },
  feed,
};

describe('@perch/theme-minimal', () => {
  it('declares the documented metadata', () => {
    expect(meta.id).toBe('minimal');
    expect(meta.plan).toBe('free');
    expect(meta.displayName.ja).toBe('ミニマル');
    expect(meta.displayName.en).toBe('Minimal');
  });

  it('renders ja snapshot', () => {
    expect(minimal.render({ ...ctxBase, locale: 'ja' })).toMatchSnapshot();
  });

  it('renders en snapshot', () => {
    expect(minimal.render({ ...ctxBase, locale: 'en' })).toMatchSnapshot();
  });

  it('escapes user-supplied HTML', () => {
    const html = minimal.render({ ...ctxBase, locale: 'ja' });
    expect(html).not.toContain('<world>');
    expect(html).toContain('&lt;world&gt;');
  });

  it('embeds the theme generator meta tag', () => {
    const html = minimal.render({ ...ctxBase, locale: 'ja' });
    expect(html).toContain('@perch/themes:minimal');
  });
});
