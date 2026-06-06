import type { Post } from '../post/index.js';
import type { NormalizedItem } from '../types/index.js';

export interface MergeTimelineOptions {
  /** Post の `url` 構築に使うベース URL（末尾スラッシュなし）。例: 'https://imds.perch.app' */
  readonly profileUrl: string;
}

function postToItem(post: Post, opts: MergeTimelineOptions): NormalizedItem {
  const localePrefix = post.locale === 'ja' ? '' : `/${post.locale}`;
  return {
    id: `perch:${post.slug}`,
    url: `${opts.profileUrl}${localePrefix}/posts/${post.slug}`,
    title: post.title,
    publishedAt: post.publishedAt,
    summary: post.excerpt,
    ogImageUrl: post.coverImage,
    locale: post.locale,
    source: { url: opts.profileUrl, name: 'perch' },
  };
}

export function mergeTimeline(
  posts: readonly Post[],
  feedItems: readonly NormalizedItem[],
  options: MergeTimelineOptions,
): readonly NormalizedItem[] {
  const postItems = posts.map((p) => postToItem(p, options));
  const merged = [...postItems, ...feedItems];
  merged.sort((a, b) => {
    if (a.publishedAt !== b.publishedAt) {
      return a.publishedAt < b.publishedAt ? 1 : -1;
    }
    const aIsPerch = a.source.name === 'perch';
    const bIsPerch = b.source.name === 'perch';
    if (aIsPerch === bIsPerch) return 0;
    return aIsPerch ? -1 : 1;
  });
  return merged;
}
