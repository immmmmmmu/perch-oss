// @perch-app/core — public API surface.
// This file is the ONLY publicly exported module; everything under
// `_internal/` is treated as private (enforced by the build configuration in
// `tsup.config.ts` and verified by the `attw` job in CI).

export const PERCH_CORE_VERSION = '0.0.0' as const;

export type {
  DroppedItem,
  FeedSource,
  FetchFailure,
  FetchFailureKind,
  FetchOgOptions,
  FetchOk,
  FetchOptions,
  FetchResult,
  Locale,
  Logger,
  NormalizedFeed,
  NormalizedItem,
  OgMetadata,
  OgStore,
  Source,
  SourceSpec,
  Validator,
} from './types/index.js';

export { defineSource } from './source/define.js';
export { fetchFeeds } from './feed/fetchFeeds.js';
export {
  resolveFeedSource,
  resolveFeedSources,
  type ResolveFeedSourceOptions,
} from './feed/resolveFeedSource.js';
export { parseFeed, UnsupportedFeedError } from './parse/index.js';
export type { ParseResult } from './parse/index.js';
export { fetchOg } from './og/index.js';

// --- Blog (TASK-blog) ---
export {
  loadConfig,
  perchConfigSchema,
  type PerchConfig,
  type ProfileConfig,
  type PostsSectionConfig,
  type LoadConfigError,
  type LoadConfigResult,
} from './config/index.js';

export {
  parseFrontmatter,
  renderMarkdown,
  renderHtml,
  loadPosts,
  postFrontmatterSchema,
  type Post,
  type PostFrontmatter,
  type PostLoadError,
  type LoadPostsResult,
  type PostSource,
  type ParseFrontmatterError,
  type ParseFrontmatterResult,
} from './post/index.js';

export { mergeTimeline, type MergeTimelineOptions } from './timeline/index.js';
export { generateRss, type GenerateRssOptions } from './rss/index.js';
