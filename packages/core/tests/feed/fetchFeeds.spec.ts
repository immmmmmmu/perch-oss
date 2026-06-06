import { describe, expect, it, vi } from 'vitest';

import { fetchFeeds, type FeedSource } from '../../src/index.js';

function makeFetchImpl(
  routes: Record<string, (signal: AbortSignal) => Promise<Response> | Response>,
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const handler = routes[url];
    if (!handler) {
      return new Response('not found', { status: 404 });
    }
    const signal = init?.signal ?? new AbortController().signal;
    if (signal.aborted) {
      throw new DOMException('aborted', 'AbortError');
    }
    return handler(signal);
  };
}

function abortablePending(signal: AbortSignal): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const onAbort = () => reject(new DOMException('aborted', 'AbortError'));
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}

const okBody = (label: string) =>
  new Response(`<rss>${label}</rss>`, {
    status: 200,
    headers: { 'content-type': 'application/rss+xml' },
  });

const sources = (...urls: string[]): readonly FeedSource[] => urls.map((url) => ({ url }));

describe('fetchFeeds', () => {
  it('returns successes / failures categorised, never aborting on individual failure', async () => {
    const fetchImpl = makeFetchImpl({
      'https://a/feed': () => okBody('a'),
      'https://b/feed': () => okBody('b'),
      'https://c/feed': async () => {
        await new Promise((r) => setTimeout(r, 100));
        return new Response('upstream', { status: 503 });
      },
      'https://d/feed': async () => {
        await new Promise((_r, reject) => setTimeout(() => reject(new Error('socket hangup')), 50));
        return new Response('', { status: 200 });
      },
      'https://e/feed': (signal) => abortablePending(signal),
    });

    const result = await fetchFeeds(
      sources(
        'https://a/feed',
        'https://b/feed',
        'https://c/feed',
        'https://d/feed',
        'https://e/feed',
      ),
      { timeoutMs: 200, totalTimeoutMs: 1_000, fetchImpl },
    );

    expect(result.successes).toHaveLength(2);
    expect(result.failures).toHaveLength(3);
    const failureKinds = result.failures.map((f) => f.kind).sort();
    expect(failureKinds).toEqual(['network', 'network', 'timeout']);
  });

  it('respects the concurrency cap', async () => {
    const inflight = { count: 0, peak: 0 };
    const fetchImpl: typeof fetch = async () => {
      inflight.count += 1;
      inflight.peak = Math.max(inflight.peak, inflight.count);
      try {
        await new Promise((r) => setTimeout(r, 30));
        return new Response('<rss/>', { status: 200 });
      } finally {
        inflight.count -= 1;
      }
    };

    const urls = Array.from({ length: 8 }, (_, i) => `https://h${String(i)}/feed`);
    await fetchFeeds(sources(...urls), { concurrency: 2, fetchImpl, timeoutMs: 1_000 });
    expect(inflight.peak).toBeLessThanOrEqual(2);
  });

  it('honours retry on transient failure', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = () => {
      calls += 1;
      if (calls === 1) return Promise.resolve(new Response('upstream', { status: 503 }));
      return Promise.resolve(okBody('ok'));
    };

    const result = await fetchFeeds(sources('https://retry/feed'), {
      retry: 1,
      fetchImpl,
      timeoutMs: 1_000,
      totalTimeoutMs: 5_000,
    });

    expect(result.successes).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it('classifies AbortError as timeout', async () => {
    const fetchImpl = makeFetchImpl({
      'https://t/feed': (signal) => abortablePending(signal),
    });
    const result = await fetchFeeds(sources('https://t/feed'), {
      timeoutMs: 50,
      totalTimeoutMs: 200,
      fetchImpl,
    });
    expect(result.failures[0]?.kind).toBe('timeout');
  });

  it('writes structured logs through the injected logger', async () => {
    const warn = vi.fn();
    const logger = { debug: vi.fn(), info: vi.fn(), warn, error: vi.fn() };
    const fetchImpl = makeFetchImpl({
      'https://w/feed': () => new Response('boom', { status: 503 }),
    });
    await fetchFeeds(sources('https://w/feed'), {
      retry: 0,
      fetchImpl,
      timeoutMs: 200,
      totalTimeoutMs: 1_000,
      logger,
    });
    expect(warn).toHaveBeenCalled();
  });

  it('marks unhandled sources as timeout when the total budget runs out', async () => {
    const fetchImpl = makeFetchImpl({
      'https://slow/feed': async () => {
        await new Promise((r) => setTimeout(r, 200));
        return okBody('slow');
      },
    });
    // concurrency 1 + total 50ms means second source never gets a chance.
    const result = await fetchFeeds(sources('https://slow/feed', 'https://never/feed'), {
      concurrency: 1,
      timeoutMs: 200,
      totalTimeoutMs: 50,
      fetchImpl,
    });
    const neverFailure = result.failures.find((f) => f.source.url === 'https://never/feed');
    expect(neverFailure?.kind).toBe('timeout');
  });
});
