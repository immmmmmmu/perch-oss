// `fetchOg` — extract Open Graph metadata for an article URL with a
// pluggable cache. Implements a 2-stage cache (caller-provided `OgStore` +
// inline TTL check), SSRF guard via `checkOutboundUrl`, and a 256 KB body
// cap so a hostile origin cannot exhaust our memory budget.
//
// Trace: docs/design/2026-05-01-perch-design.md §3.4 + FR-3 + NFR-4.

import { fnv1aHex } from '../_internal/hash.js';
import { decodeEntities } from '../_internal/html.js';
import { checkOutboundUrl } from '../_internal/url-guard.js';

import type { FetchOgOptions, OgMetadata, OgStore } from '../types/index.js';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_REDIRECTS = 3;
const DEFAULT_USER_AGENT = 'perch-core/0.0 (+https://github.com/immmmmmmu/perch-oss)';

function hashUrl(url: string): string {
  return fnv1aHex(url);
}

function metaContent(html: string, key: 'property' | 'name', target: string): string | undefined {
  // Allow attribute order in either direction; lower-case attribute names.
  const pattern = new RegExp(
    `<meta\\s+[^>]*${key}\\s*=\\s*["']${target}["'][^>]*content\\s*=\\s*["']([^"']*)["'][^>]*/?>`,
    'i',
  );
  const reverse = new RegExp(
    `<meta\\s+[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*${key}\\s*=\\s*["']${target}["'][^>]*/?>`,
    'i',
  );
  const match = pattern.exec(html) ?? reverse.exec(html);
  if (!match?.[1]) return undefined;
  return decodeEntities(match[1]).trim() || undefined;
}

function pageTitle(html: string): string | undefined {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match?.[1]) return undefined;
  return decodeEntities(match[1]).replace(/\s+/g, ' ').trim() || undefined;
}

function extractFrom(html: string, url: string): OgMetadata {
  const title =
    metaContent(html, 'property', 'og:title') ??
    metaContent(html, 'name', 'twitter:title') ??
    pageTitle(html);
  const description =
    metaContent(html, 'property', 'og:description') ??
    metaContent(html, 'name', 'description') ??
    metaContent(html, 'name', 'twitter:description');
  const imageUrl =
    metaContent(html, 'property', 'og:image') ?? metaContent(html, 'name', 'twitter:image');
  return {
    url,
    fetchedAt: new Date().toISOString(),
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
}

async function readCappedBody(res: Response, capBytes: number): Promise<string> {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let total = 0;
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      buffer += decoder.decode(value, { stream: true });
      if (total >= capBytes) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        break;
      }
    }
  }
  buffer += decoder.decode();
  return buffer;
}

async function followRedirects(
  initialUrl: string,
  fetchImpl: typeof fetch,
  userAgent: string,
): Promise<{ readonly response: Response; readonly finalUrl: string }> {
  let target = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const guard = checkOutboundUrl(target);
    if (!guard.ok) {
      throw new Error(`og: blocked url (${guard.reason})`);
    }
    const res = await fetchImpl(target, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'user-agent': userAgent, accept: 'text/html,application/xhtml+xml' },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new Error(`og: ${String(res.status)} without Location header`);
      }
      target = new URL(location, target).href;
      continue;
    }
    return { response: res, finalUrl: target };
  }
  throw new Error(`og: too many redirects (>${String(MAX_REDIRECTS)})`);
}

/**
 * Look up Open Graph metadata for a single article URL. Returns a stub record
 * carrying only the URL + `fetchedAt` if the upstream cannot be reached or the
 * response cannot be parsed — callers can grace-degrade (FR-4).
 */
export async function fetchOg(
  url: string,
  store: OgStore,
  opts: FetchOgOptions = {},
): Promise<OgMetadata> {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
  const logger = opts.logger;

  const guard = checkOutboundUrl(url);
  if (!guard.ok) {
    logger?.warn('og: url rejected', { url, reason: guard.reason });
    return { url, fetchedAt: new Date().toISOString() };
  }

  const cacheKey = hashUrl(guard.url.href);
  const cached = await store.get(cacheKey);
  if (cached) {
    const cachedAt = Date.parse(cached.fetchedAt);
    if (!Number.isNaN(cachedAt) && Date.now() - cachedAt <= ttlMs) {
      return cached;
    }
  }

  try {
    const { response, finalUrl } = await followRedirects(guard.url.href, fetchImpl, userAgent);
    if (!response.ok) {
      logger?.warn('og: non-2xx response', { url: finalUrl, status: response.status });
      const fallback: OgMetadata = { url: finalUrl, fetchedAt: new Date().toISOString() };
      await store.put(cacheKey, fallback, ttlMs);
      return fallback;
    }
    const body = await readCappedBody(response, MAX_BODY_BYTES);
    const og = extractFrom(body, finalUrl);
    await store.put(cacheKey, og, ttlMs);
    return og;
  } catch (err) {
    logger?.warn('og: fetch failed', {
      url,
      message: err instanceof Error ? err.message : String(err),
    });
    return { url, fetchedAt: new Date().toISOString() };
  }
}
