import { describe, expect, it } from 'vitest';

import { mergeTimeline } from '../../src/timeline/merge.js';

import type { Post } from '../../src/post/index.js';
import type { NormalizedItem } from '../../src/types/index.js';

const post = (slug: string, date: string): Post => ({
  slug,
  locale: 'ja',
  title: slug,
  publishedAt: date,
  tags: [],
  draft: false,
  bodyHtml: '<p>x</p>',
  excerpt: 'x',
  sourcePath: `./posts/${slug}.md`,
});

const feedItem = (id: string, date: string): NormalizedItem => ({
  id,
  url: `https://ext.example/${id}`,
  title: id,
  publishedAt: date,
  source: { url: 'https://ext.example/rss', name: 'ext' },
});

describe('mergeTimeline', () => {
  it('interleaves posts and feed items by publishedAt desc', () => {
    const merged = mergeTimeline(
      [post('a', '2026-05-10'), post('b', '2026-05-13')],
      [feedItem('x', '2026-05-12'), feedItem('y', '2026-05-09')],
      { profileUrl: 'https://imds.perch.app' },
    );
    expect(merged.map((m) => m.id)).toEqual(['perch:b', 'x', 'perch:a', 'y']);
  });

  it('marks perch posts with source.name="perch"', () => {
    const merged = mergeTimeline([post('a', '2026-05-12')], [], {
      profileUrl: 'https://imds.perch.app',
    });
    expect(merged[0]!.source.name).toBe('perch');
    expect(merged[0]!.url).toBe('https://imds.perch.app/posts/a');
  });

  it('breaks ties by giving perch posts priority on identical dates', () => {
    const merged = mergeTimeline([post('p', '2026-05-12')], [feedItem('x', '2026-05-12')], {
      profileUrl: 'https://imds.perch.app',
    });
    expect(merged[0]!.id).toBe('perch:p');
    expect(merged[1]!.id).toBe('x');
  });

  it('passes through feed items unchanged when there are no posts', () => {
    const items = [feedItem('x', '2026-05-12')];
    const merged = mergeTimeline([], items, { profileUrl: 'https://imds.perch.app' });
    expect(merged).toEqual(items);
  });
});
