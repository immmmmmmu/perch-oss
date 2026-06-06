import { describe, expect, it } from 'vitest';

import { parseFrontmatter } from '../../src/post/parseFrontmatter.js';

const VALID = `---
title: Hello
publishedAt: 2026-05-12
tags: [perch, release]
---

# 本文

これは本文です。`;

const MISSING_TITLE = `---
publishedAt: 2026-05-12
---
body`;

const INVALID_DATE = `---
title: Hello
publishedAt: not-a-date
---
body`;

describe('parseFrontmatter', () => {
  it('returns frontmatter and body when valid', () => {
    const result = parseFrontmatter(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.frontmatter.title).toBe('Hello');
    expect(result.value.frontmatter.publishedAt).toBe('2026-05-12');
    expect(result.value.frontmatter.tags).toEqual(['perch', 'release']);
    expect(result.value.frontmatter.format).toBe('markdown');
    expect(result.value.frontmatter.draft).toBe(false);
    expect(result.value.body.trim().startsWith('# 本文')).toBe(true);
  });

  it('returns schema error when title is missing', () => {
    const result = parseFrontmatter(MISSING_TITLE);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.code).toBe('schema');
  });

  it('returns schema error when publishedAt is not YYYY-MM-DD', () => {
    const result = parseFrontmatter(INVALID_DATE);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.code).toBe('schema');
  });

  it('returns missing error when no frontmatter block present', () => {
    const result = parseFrontmatter('# just body, no frontmatter');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.code).toBe('missing');
  });
});
