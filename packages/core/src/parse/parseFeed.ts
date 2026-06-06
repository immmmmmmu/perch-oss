// `parseFeed` — convert a fetched body into a `NormalizedFeed`.
// Supported: RSS 2.0, Atom 1.0, JSON Feed 1.x.
// Trace: docs/design/2026-05-01-perch-design.md §4.1, FR-2.

import { XMLParser } from 'fast-xml-parser';

import { fnv1aHex } from '../_internal/hash.js';
import { plainText } from '../_internal/html.js';

import { UnsupportedFeedError } from './UnsupportedFeedError.js';

import type {
  DroppedItem,
  FeedSource,
  Locale,
  NormalizedFeed,
  NormalizedItem,
} from '../types/index.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  parseTagValue: false,
  cdataPropName: '__cdata',
  preserveOrder: false,
  isArray: (name) => ['item', 'entry', 'category', 'author', 'link', 'enclosure'].includes(name),
});

export interface ParseResult {
  readonly feed: NormalizedFeed;
  readonly dropped: readonly DroppedItem[];
}

type Json = unknown;

function ensureArray<T>(value: T | readonly T[] | undefined | null): readonly T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value as T];
}

function asString(value: Json): string | undefined {
  if (typeof value === 'string') return value;
  if (value == null) return undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const text = (value as { '#text'?: string; __cdata?: string })['#text'];
    if (typeof text === 'string') return text;
    const cdata = (value as { __cdata?: string }).__cdata;
    if (typeof cdata === 'string') return cdata;
  }
  return undefined;
}

function detectFormat(body: string): 'rss' | 'atom' | 'json' {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new UnsupportedFeedError('empty body');
  }
  if (trimmed.startsWith('{')) return 'json';
  if (trimmed.startsWith('<')) {
    if (/<rss\b/i.test(trimmed)) return 'rss';
    if (/<feed[^>]*xmlns\s*=\s*['"]http:\/\/www\.w3\.org\/2005\/Atom['"]/i.test(trimmed)) {
      return 'atom';
    }
    if (/<feed\b/i.test(trimmed)) return 'atom';
  }
  throw new UnsupportedFeedError('feed format not recognised');
}

function toLocale(value: string | undefined): Locale | undefined {
  if (!value) return undefined;
  return value.toLowerCase() as Locale;
}

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return undefined;
  return new Date(ts).toISOString();
}

function rssChannel(parsed: Json): Record<string, Json> {
  const channel = (parsed as { rss?: { channel?: Record<string, Json> } }).rss?.channel;
  if (!channel) throw new UnsupportedFeedError('rss: missing <channel>');
  return channel;
}

function atomFeed(parsed: Json): Record<string, Json> {
  const feed = (parsed as { feed?: Record<string, Json> }).feed;
  if (!feed) throw new UnsupportedFeedError('atom: missing <feed>');
  return feed;
}

function pickAtomLink(linkValue: Json): string | undefined {
  if (!linkValue) return undefined;
  const links = ensureArray(linkValue);
  for (const link of links) {
    if (typeof link === 'string') return link;
    const obj = link as { '@_href'?: string; '@_rel'?: string; '@_type'?: string };
    if (obj['@_rel'] === 'alternate' || !obj['@_rel']) {
      if (obj['@_href']) return obj['@_href'];
    }
  }
  const first = links[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') {
    return (first as { '@_href'?: string })['@_href'];
  }
  return undefined;
}

function summaryFrom(value: Json): string | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const trimmed = plainText(raw);
  return trimmed.length > 0 ? trimmed : undefined;
}

interface NormaliseInput {
  readonly source: FeedSource;
  readonly id: string | undefined;
  readonly url: string | undefined;
  readonly title: string | undefined;
  readonly publishedAt: string | undefined;
  readonly summary?: string;
  readonly ogImageUrl?: string;
  readonly authors?: readonly string[];
  readonly itemLocale?: Locale;
  readonly feedLocale?: Locale;
}

interface NormaliseOk {
  readonly ok: true;
  readonly item: NormalizedItem;
}
interface NormaliseDropped {
  readonly ok: false;
  readonly reason: string;
}

function normaliseItem(input: NormaliseInput): NormaliseOk | NormaliseDropped {
  const url = input.url?.trim();
  const title = input.title?.trim();
  const publishedAt = input.publishedAt;
  if (!url || !title || !publishedAt) {
    const missing: string[] = [];
    if (!url) missing.push('url');
    if (!title) missing.push('title');
    if (!publishedAt) missing.push('publishedAt');
    return { ok: false, reason: `missing field(s): ${missing.join(', ')}` };
  }
  const id = input.id?.trim() ?? `urlhash:${fnv1aHex(url)}`;
  const item: NormalizedItem = {
    id,
    url,
    title,
    publishedAt,
    ...(input.summary ? { summary: input.summary } : {}),
    ...(input.ogImageUrl ? { ogImageUrl: input.ogImageUrl } : {}),
    ...(input.authors && input.authors.length > 0 ? { authors: input.authors } : {}),
    ...((input.itemLocale ?? input.feedLocale)
      ? { locale: input.itemLocale ?? input.feedLocale }
      : {}),
    source: { url: input.source.url, ...(input.source.name ? { name: input.source.name } : {}) },
  };
  return { ok: true, item };
}

function parseRss(parsed: Json, source: FeedSource): ParseResult {
  const channel = rssChannel(parsed);
  const feedLocale = toLocale(asString(channel.language));
  const items = ensureArray(channel.item);
  const dropped: DroppedItem[] = [];
  const successful: NormalizedItem[] = [];

  for (const raw of items) {
    const obj = raw as Record<string, Json>;
    const guid = asString(obj.guid);
    const linkValue = ensureArray(obj.link).find((l) => typeof l === 'string');
    const link = linkValue ?? asString(obj.link);
    const itemLocale = toLocale(asString(obj['dc:language'])) ?? feedLocale;
    const enclosure = ensureArray(obj.enclosure)[0] as
      | { '@_url'?: string; '@_type'?: string }
      | undefined;
    // note / Substack / WordPress emit <media:thumbnail> for the article OG image.
    const mediaThumbnailRaw = obj['media:thumbnail'];
    const mediaThumbnail =
      typeof mediaThumbnailRaw === 'string'
        ? mediaThumbnailRaw
        : (mediaThumbnailRaw as { '@_url'?: string } | undefined)?.['@_url'];
    const enclosureImage =
      enclosure?.['@_type']?.startsWith('image/') && enclosure['@_url']
        ? enclosure['@_url']
        : undefined;
    const ogImageUrl = enclosureImage ?? mediaThumbnail ?? undefined;
    const authorsRaw = ensureArray(obj.author);
    const authors = authorsRaw
      .map((a) => asString(a))
      .filter((a): a is string => Boolean(a?.trim()));

    const result = normaliseItem({
      source,
      id: guid,
      url: link,
      title: asString(obj.title),
      publishedAt: toIsoDate(asString(obj.pubDate)),
      summary: summaryFrom(obj.description),
      ogImageUrl,
      authors,
      itemLocale,
      feedLocale,
    });

    if (result.ok) successful.push(result.item);
    else dropped.push({ source, reason: result.reason });
  }

  return {
    feed: {
      source,
      items: successful,
      fetchedAt: new Date().toISOString(),
    },
    dropped,
  };
}

function parseAtom(parsed: Json, source: FeedSource): ParseResult {
  const feed = atomFeed(parsed);
  const feedLocale = toLocale(asString(feed['@_xml:lang'])) ?? toLocale(asString(feed['xml:lang']));
  const entries = ensureArray(feed.entry);
  const dropped: DroppedItem[] = [];
  const successful: NormalizedItem[] = [];

  for (const raw of entries) {
    const entry = raw as Record<string, Json>;
    const id = asString(entry.id);
    const url = pickAtomLink(entry.link);
    const updated = asString(entry.updated);
    const published = asString(entry.published);
    const itemLocale = toLocale(asString(entry['@_xml:lang']));
    const summary = summaryFrom(entry.summary) ?? summaryFrom(entry.content) ?? undefined;
    const authorsRaw = ensureArray(entry.author);
    const authors = authorsRaw
      .map((a) => {
        if (typeof a === 'string') return a;
        return asString((a as Record<string, Json>).name);
      })
      .filter((a): a is string => Boolean(a?.trim()));

    const result = normaliseItem({
      source,
      id,
      url,
      title: asString(entry.title),
      publishedAt: toIsoDate(published ?? updated),
      summary,
      authors,
      itemLocale,
      feedLocale,
    });

    if (result.ok) successful.push(result.item);
    else dropped.push({ source, reason: result.reason });
  }

  return {
    feed: { source, items: successful, fetchedAt: new Date().toISOString() },
    dropped,
  };
}

interface JsonFeedItem {
  readonly id?: string;
  readonly url?: string;
  readonly external_url?: string;
  readonly title?: string;
  readonly content_text?: string;
  readonly content_html?: string;
  readonly summary?: string;
  readonly date_published?: string;
  readonly date_modified?: string;
  readonly image?: string;
  readonly authors?: readonly { readonly name?: string }[];
  readonly author?: { readonly name?: string };
  readonly language?: string;
}

interface JsonFeedRoot {
  readonly version?: string;
  readonly title?: string;
  readonly language?: string;
  readonly items?: readonly JsonFeedItem[];
}

function parseJsonFeed(body: string, source: FeedSource): ParseResult {
  let parsed: JsonFeedRoot;
  try {
    parsed = JSON.parse(body) as JsonFeedRoot;
  } catch (err) {
    throw new UnsupportedFeedError(`json: invalid JSON (${(err as Error).message})`);
  }
  if (typeof parsed.version !== 'string' || !parsed.version.includes('jsonfeed.org')) {
    throw new UnsupportedFeedError('json: missing or wrong "version" field');
  }
  const feedLocale = toLocale(parsed.language);
  const dropped: DroppedItem[] = [];
  const successful: NormalizedItem[] = [];

  for (const item of parsed.items ?? []) {
    const url = item.url ?? item.external_url;
    const summary =
      item.summary?.trim() ?? (item.content_text ? plainText(item.content_text) : undefined);
    const authors =
      item.authors?.map((a) => a.name).filter((n): n is string => Boolean(n?.trim())) ??
      (item.author?.name ? [item.author.name] : undefined);
    const result = normaliseItem({
      source,
      id: item.id,
      url,
      title: item.title,
      publishedAt: toIsoDate(item.date_published ?? item.date_modified),
      summary,
      ogImageUrl: item.image,
      authors,
      itemLocale: toLocale(item.language),
      feedLocale,
    });

    if (result.ok) successful.push(result.item);
    else dropped.push({ source, reason: result.reason });
  }

  return {
    feed: { source, items: successful, fetchedAt: new Date().toISOString() },
    dropped,
  };
}

/**
 * Parse a feed body into a {@link NormalizedFeed}. The format is detected from
 * the first non-whitespace bytes; callers do not need to pre-classify.
 *
 * @throws {UnsupportedFeedError} if the body is neither RSS / Atom / JSON Feed.
 */
export function parseFeed(body: string | Uint8Array, source: FeedSource): ParseResult {
  const text = typeof body === 'string' ? body : new TextDecoder('utf-8').decode(body);
  const format = detectFormat(text);
  if (format === 'json') return parseJsonFeed(text, source);
  const parsed = xmlParser.parse(text) as Json;
  if (format === 'rss') return parseRss(parsed, source);
  return parseAtom(parsed, source);
}
