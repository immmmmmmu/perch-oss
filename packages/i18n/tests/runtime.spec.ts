import { describe, expect, it } from 'vitest';

import { m, setLocale, getLocale, SUPPORTED_LOCALES } from '../src/index.js';

describe('@perch-app/i18n runtime', () => {
  it('exposes ja and en in SUPPORTED_LOCALES', () => {
    expect([...SUPPORTED_LOCALES].sort()).toEqual(['en', 'ja']);
  });

  it('renders message in the active locale', () => {
    void setLocale('ja');
    expect(getLocale()).toBe('ja');
    expect(m.common_login()).toBe('ログイン');

    void setLocale('en');
    expect(getLocale()).toBe('en');
    expect(m.common_login()).toBe('Sign in');
  });

  it('substitutes variables', () => {
    void setLocale('en');
    expect(m.feed_last_fetched({ at: '2026-05-01T12:00:00Z' })).toContain('2026-05-01T12:00:00Z');
  });
});
