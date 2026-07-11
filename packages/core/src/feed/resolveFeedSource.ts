import type { FeedSource } from '../types/index.js';

const YOUTUBE_FEED_PATH = '/feeds/videos.xml';
const YOUTUBE_CHANNEL_META_RE =
  /<meta\b(?=[^>]*\bitemprop=["']channelId["'])(?=[^>]*\bcontent=["'](UC[A-Za-z0-9_-]{6,})["'])[^>]*>/i;
const YOUTUBE_CANONICAL_RE =
  /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']*\/channel\/(UC[A-Za-z0-9_-]{6,})[^"']*["'])[^>]*>/i;
const YOUTUBE_JSON_CHANNEL_RE = /"(?:channelId|externalId)"\s*:\s*"(UC[A-Za-z0-9_-]{6,})"/;

export interface ResolveFeedSourceOptions {
  readonly fetchImpl?: typeof fetch;
}

function isYouTubeHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com';
}

function youtubeFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

function channelIdFromPath(url: URL): string | undefined {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'channel') return undefined;
  return parts[1]?.startsWith('UC') ? parts[1] : undefined;
}

function extractChannelIdFromHtml(html: string): string | undefined {
  const metaMatch = YOUTUBE_CHANNEL_META_RE.exec(html);
  if (metaMatch?.[1]) return metaMatch[1];

  const canonicalMatch = YOUTUBE_CANONICAL_RE.exec(html);
  if (canonicalMatch?.[1]) return canonicalMatch[1];

  const jsonMatch = YOUTUBE_JSON_CHANNEL_RE.exec(html);
  return jsonMatch?.[1];
}

async function resolveYouTubePageUrl(
  source: FeedSource,
  fetchImpl: typeof fetch,
): Promise<FeedSource> {
  try {
    const res = await fetchImpl(source.url, {
      headers: { accept: 'text/html, */*;q=0.8' },
    });
    if (!res.ok) return source;
    const channelId = extractChannelIdFromHtml(await res.text());
    if (!channelId) return source;
    return { ...source, url: youtubeFeedUrl(channelId) };
  } catch {
    return source;
  }
}

/**
 * Resolve user-facing feed source URLs to machine-readable feeds when the
 * platform exposes a stable feed endpoint behind a profile URL.
 */
export async function resolveFeedSource(
  source: FeedSource,
  opts: ResolveFeedSourceOptions = {},
): Promise<FeedSource> {
  let url: URL;
  try {
    url = new URL(source.url);
  } catch {
    return source;
  }

  if (!isYouTubeHost(url.hostname)) return source;
  if (url.pathname === YOUTUBE_FEED_PATH && url.searchParams.has('channel_id')) return source;

  const channelId = channelIdFromPath(url);
  if (channelId) return { ...source, url: youtubeFeedUrl(channelId) };

  const parts = url.pathname.split('/').filter(Boolean);
  const first = parts[0];
  const isResolvablePage =
    (first?.startsWith('@') ?? false) || first === 'c' || first === 'user' || first === 'channel';
  if (!isResolvablePage) return source;

  const fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  return resolveYouTubePageUrl(source, fetchImpl);
}

export async function resolveFeedSources(
  sources: readonly FeedSource[],
  opts: ResolveFeedSourceOptions = {},
): Promise<readonly FeedSource[]> {
  return await Promise.all(sources.map((source) => resolveFeedSource(source, opts)));
}
