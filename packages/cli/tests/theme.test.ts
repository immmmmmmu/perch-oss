import { describe, it, expect } from 'vitest';

import { listThemes, getThemeMeta } from '../src/commands/theme.js';

describe('listThemes', () => {
  it('returns array of available themes', () => {
    const themes = listThemes();
    expect(Array.isArray(themes)).toBe(true);
    expect(themes.length).toBeGreaterThan(0);
  });

  it('minimal theme is in the list', () => {
    const themes = listThemes();
    const ids = themes.map((t) => t.id);
    expect(ids).toContain('minimal');
  });

  it('each theme has id and displayName', () => {
    const themes = listThemes();
    for (const t of themes) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.displayName).toBe('object');
    }
  });

  it('describes themes by use case', () => {
    const editorial = getThemeMeta('editorial');
    expect(editorial?.description.en).toBe('Writing, expertise, and trust');
    expect(editorial?.description.ja).toBe('文章、専門性、信頼感');
  });

  it('includes all 5 themes', () => {
    const themes = listThemes();
    expect(themes).toHaveLength(5);
  });
});

describe('getThemeMeta', () => {
  it('returns meta for existing theme', () => {
    const meta = getThemeMeta('minimal');
    expect(meta).toBeDefined();
    expect(meta!.id).toBe('minimal');
  });

  it('returns undefined for unknown theme', () => {
    expect(getThemeMeta('nonexistent')).toBeUndefined();
  });

  it('returns descriptions for bundled themes', () => {
    const meta = getThemeMeta('card');
    expect(meta!.description.en).toBe('Social bio links and latest posts');
    expect(meta!.description.ja).toBe('SNS bio 向けリンクと最新投稿');
  });

  it('returns correct displayName', () => {
    const meta = getThemeMeta('minimal');
    expect(meta!.displayName.en).toBe('Minimal');
    expect(meta!.displayName.ja).toBe('ミニマル');
  });
});
