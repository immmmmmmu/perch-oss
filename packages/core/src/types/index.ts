// @perch-app/core public type surface.
// All shapes are readonly to encourage immutable callers; mutation is contained
// to opaque internal helpers in `_internal/`.
//
// Trace: docs/design/2026-05-01-perch-design.md §3.1

/**
 * BCP-47-ish locale tag in the form `ja`, `en`, `zh-TW`, etc.
 * Validation happens at the boundary; this is a structural alias.
 */
export type Locale = `${Lowercase<string>}` | `${Lowercase<string>}-${Uppercase<string>}`;

/** Categorised reason a feed fetch failed. */
export type FetchFailureKind = 'timeout' | 'network' | 'parse' | 'unsupported';

/** A single feed input declared by the caller. */
export interface FeedSource {
  readonly url: string;
  readonly locale?: Locale;
  readonly name?: string;
}

/** Optional injection points for `fetchFeeds` and friends. */
export interface FetchOptions {
  /** Default 8. Per-call cap on parallel HTTP requests. (NFR-1) */
  readonly concurrency?: number;
  /** Default 5_000 ms. Per-URL timeout. */
  readonly timeoutMs?: number;
  /** Default 30_000 ms. Total wall-clock cap across the whole batch. */
  readonly totalTimeoutMs?: number;
  /** Default 0. Allowed retries per failing URL (max 2). */
  readonly retry?: number;
  readonly userAgent?: string;
  /** Allows tests / SSR-safe sandboxes to substitute the global `fetch`. */
  readonly fetchImpl?: typeof fetch;
  readonly logger?: Logger;
}

/** Minimal logger shape — `console` direct usage is forbidden in core. */
export interface Logger {
  debug(message: string, fields?: Readonly<Record<string, unknown>>): void;
  info(message: string, fields?: Readonly<Record<string, unknown>>): void;
  warn(message: string, fields?: Readonly<Record<string, unknown>>): void;
  error(message: string, fields?: Readonly<Record<string, unknown>>): void;
}

/** Normalised representation of a single article / item. */
export interface NormalizedItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  /** ISO 8601 timestamp. */
  readonly publishedAt: string;
  readonly summary?: string;
  readonly ogImageUrl?: string;
  readonly authors?: readonly string[];
  readonly locale?: Locale;
  readonly source: {
    readonly url: string;
    readonly name?: string;
  };
}

/** Successfully parsed feed wrapping its items. */
export interface NormalizedFeed {
  readonly source: FeedSource;
  readonly items: readonly NormalizedItem[];
  /** ISO 8601 timestamp of when the fetch completed. */
  readonly fetchedAt: string;
}

/** Per-source success record. */
export interface FetchOk {
  readonly kind: 'ok';
  readonly source: FeedSource;
  readonly feed: NormalizedFeed;
}

/** Per-source failure record (categorised). */
export interface FetchFailure {
  readonly kind: FetchFailureKind;
  readonly source: FeedSource;
  readonly message: string;
}

/** Items dropped during normalisation (missing required fields). */
export interface DroppedItem {
  readonly source: FeedSource;
  readonly reason: string;
}

/** Aggregate result of a `fetchFeeds(...)` invocation. */
export interface FetchResult {
  readonly successes: readonly FetchOk[];
  readonly failures: readonly FetchFailure[];
  readonly dropped: readonly DroppedItem[];
}

/** OG metadata extracted for an article URL. */
export interface OgMetadata {
  readonly url: string;
  readonly title?: string;
  readonly description?: string;
  readonly imageUrl?: string;
  /** ISO 8601 timestamp of when the OG was fetched / cached. */
  readonly fetchedAt: string;
}

/** Pluggable cache for OG lookups (filesystem, KV, R2, in-memory…). */
export interface OgStore {
  get(urlHash: string): Promise<OgMetadata | undefined>;
  put(urlHash: string, value: OgMetadata, ttlMs: number): Promise<void>;
}

/** Optional tunables for `fetchOg`. */
export interface FetchOgOptions {
  /** Default 86_400_000 ms (24h). */
  readonly ttlMs?: number;
  readonly fetchImpl?: typeof fetch;
  readonly userAgent?: string;
  readonly logger?: Logger;
}

/** A custom feed source registered via `defineSource`. */
export interface Source<TConfig> {
  readonly id: string;
  fetch(config: TConfig): Promise<NormalizedFeed>;
}

/**
 * Spec passed to `defineSource` to register a custom source (e.g. YouTube,
 * Substack). The runtime (`@perch-app/core`) does NOT bundle a Zod runtime; the
 * caller passes a parser which we duck-type via the `Validator<T>` interface.
 */
export interface SourceSpec<TConfig> {
  readonly id: string;
  readonly configSchema: Validator<TConfig>;
  fetch(config: TConfig): Promise<NormalizedFeed>;
}

/** Minimal duck-typed parser shape so we don't pull `zod` into core deps. */
export interface Validator<T> {
  parse(input: unknown): T;
}
