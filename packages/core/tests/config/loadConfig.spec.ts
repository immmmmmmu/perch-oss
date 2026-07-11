import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config/loadConfig.js';

const MINIMAL_YAML = `
profile:
  name: Test User
locale: ja
theme: editorial
feeds: []
`;

const WITH_POSTS_YAML = `
profile:
  name: Test User
locale: ja
theme: editorial
feeds: []
posts:
  enabled: true
  dir: ./posts
  perPage: 5
`;

describe('loadConfig', () => {
  it('parses a minimal config and applies posts defaults', () => {
    const result = loadConfig(MINIMAL_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.profile.name).toBe('Test User');
    expect(result.value.locale).toBe('ja');
    expect(result.value.posts).toEqual({
      enabled: false,
      dir: './posts',
      assetsDir: './assets',
      perPage: 10,
      showInTimeline: true,
    });
    expect(result.value.timeline).toEqual({
      maxItems: undefined,
    });
  });

  it('respects explicit posts section', () => {
    const result = loadConfig(WITH_POSTS_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.posts.enabled).toBe(true);
    expect(result.value.posts.perPage).toBe(5);
    expect(result.value.posts.dir).toBe('./posts');
  });

  it('respects explicit timeline section', () => {
    const result = loadConfig(`
profile:
  name: Test User
locale: ja
theme: editorial
feeds: []
timeline:
  maxItems: 15
`);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.timeline.maxItems).toBe(15);
  });

  it('returns error on invalid YAML', () => {
    const result = loadConfig(': : invalid');
    expect(result.ok).toBe(false);
  });

  it('returns error when profile.name is missing', () => {
    const result = loadConfig('profile: {}\nlocale: ja\ntheme: editorial\nfeeds: []');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.code).toBe('schema');
  });

  it('rejects unknown locale', () => {
    const result = loadConfig('profile:\n  name: X\nlocale: zz\ntheme: editorial\nfeeds: []');
    expect(result.ok).toBe(false);
  });
});
