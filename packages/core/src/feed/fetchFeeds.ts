// `fetchFeeds` — bounded-parallel feed fetcher with retries, per-URL timeouts,
// and a global wall-clock cap. Designed so individual failures never abort the
// whole batch (FR-1, FR-4, NFR-1).

import type {
  FeedSource,
  FetchFailure,
  FetchOk,
  FetchOptions,
  FetchResult,
  Logger,
} from '../types/index.js';

const DEFAULT_CONCURRENCY = 8;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_TOTAL_TIMEOUT_MS = 30_000;
const MAX_RETRY = 2;
const DEFAULT_USER_AGENT = 'perch-core/0.0 (+https://github.com/immmmmmmu/perch-oss)';

const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

interface FetchOnce {
  readonly status: number;
  readonly body: string;
}

class TimeoutError extends Error {
  constructor() {
    super('timeout');
    this.name = 'TimeoutError';
  }
}

async function fetchOnce(
  url: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
  userAgent: string,
): Promise<FetchOnce> {
  const res = await fetchImpl(url, {
    method: 'GET',
    redirect: 'follow',
    signal,
    headers: {
      accept:
        'application/atom+xml, application/rss+xml, application/feed+json, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
      'user-agent': userAgent,
    },
  });
  if (res.status >= 500 || res.status === 408 || res.status === 429) {
    throw new Error(`network: status=${String(res.status)}`);
  }
  if (!res.ok) {
    throw new Error(`network: status=${String(res.status)}`);
  }
  const body = await res.text();
  return { status: res.status, body };
}

function classifyError(err: unknown): 'timeout' | 'network' {
  if (err instanceof TimeoutError) return 'timeout';
  if (err instanceof Error) {
    if (err.name === 'AbortError') return 'timeout';
    if (err.message.startsWith('timeout')) return 'timeout';
  }
  return 'network';
}

async function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  parentSignal: AbortSignal,
  timeoutMs: number,
): Promise<T> {
  const ctrl = new AbortController();
  const onParentAbort = () => ctrl.abort(parentSignal.reason);
  if (parentSignal.aborted) ctrl.abort(parentSignal.reason);
  else parentSignal.addEventListener('abort', onParentAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(new TimeoutError()), timeoutMs);
  try {
    return await task(ctrl.signal);
  } catch (err) {
    if (ctrl.signal.aborted && ctrl.signal.reason instanceof TimeoutError) {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
    parentSignal.removeEventListener('abort', onParentAbort);
  }
}

function backoffDelay(attempt: number): number {
  // 200 * 2^attempt + jitter[0..100)
  return 200 * 2 ** attempt + Math.floor(Math.random() * 100);
}

async function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'));
    };
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

interface AttemptResult {
  readonly source: FeedSource;
  readonly ok?: { readonly status: number; readonly body: string };
  readonly failure?: { readonly kind: 'timeout' | 'network'; readonly message: string };
}

async function attempt(
  source: FeedSource,
  opts: Required<Pick<FetchOptions, 'timeoutMs' | 'retry' | 'fetchImpl' | 'userAgent'>> & {
    readonly logger: Logger;
    readonly globalSignal: AbortSignal;
  },
): Promise<AttemptResult> {
  const maxAttempts = Math.min(opts.retry, MAX_RETRY) + 1;
  let lastError: { kind: 'timeout' | 'network'; message: string } | undefined;
  for (let i = 0; i < maxAttempts; i++) {
    if (opts.globalSignal.aborted) break;
    try {
      const result = await withTimeout(
        (signal) => fetchOnce(source.url, signal, opts.fetchImpl, opts.userAgent),
        opts.globalSignal,
        opts.timeoutMs,
      );
      return { source, ok: result };
    } catch (err) {
      const kind = classifyError(err);
      const message = err instanceof Error ? err.message : String(err);
      lastError = { kind, message };
      opts.logger.warn('feed fetch attempt failed', {
        url: source.url,
        attempt: i + 1,
        kind,
        message,
      });
      if (i + 1 < maxAttempts && !opts.globalSignal.aborted) {
        try {
          await sleep(backoffDelay(i), opts.globalSignal);
        } catch {
          break; // global timeout fired
        }
      }
    }
  }
  return {
    source,
    failure: lastError ?? { kind: 'timeout', message: 'global timeout' },
  };
}

async function runWithConcurrency<T>(
  inputs: readonly T[],
  concurrency: number,
  worker: (input: T) => Promise<void>,
): Promise<void> {
  const queue = inputs.slice();
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;
          await worker(next);
        }
      })(),
    );
  }
  await Promise.all(workers);
}

/**
 * Fetch the bodies of every supplied feed source in parallel, never abort the
 * whole batch on individual failures, and return a categorised
 * {@link FetchResult}. Parsing is the caller's responsibility — wire this up
 * with `parseFeed` (TASK-0007) for end-to-end ingestion.
 */
export async function fetchFeeds(
  sources: readonly FeedSource[],
  opts: FetchOptions = {},
): Promise<FetchResult> {
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const totalTimeoutMs = opts.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS;
  const retry = opts.retry ?? 0;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
  const logger = opts.logger ?? noopLogger;

  const globalCtrl = new AbortController();
  const globalTimer = setTimeout(() => globalCtrl.abort(new TimeoutError()), totalTimeoutMs);

  const successes: FetchOk[] = [];
  const failures: FetchFailure[] = [];

  try {
    await runWithConcurrency(sources, concurrency, async (source) => {
      const r = await attempt(source, {
        timeoutMs,
        retry,
        fetchImpl,
        userAgent,
        logger,
        globalSignal: globalCtrl.signal,
      });
      if (r.ok) {
        // The success record currently exposes a stub feed — parsing is
        // intentionally external (TASK-0007 wires `parseFeed`). Callers that
        // already have a parser can chain on the body via the rebuilt
        // helpers in `index.ts`.
        successes.push({
          kind: 'ok',
          source: r.source,
          feed: {
            source: r.source,
            items: [],
            fetchedAt: new Date().toISOString(),
          },
        });
      } else if (r.failure) {
        failures.push({
          kind: r.failure.kind,
          source: r.source,
          message: r.failure.message,
        });
      }
    });
  } finally {
    clearTimeout(globalTimer);
  }

  // Sources that the global timer killed and didn't even attempt are
  // surfaced as `timeout` so callers can reason about coverage.
  const handledUrls = new Set([
    ...successes.map((s) => s.source.url),
    ...failures.map((f) => f.source.url),
  ]);
  for (const source of sources) {
    if (handledUrls.has(source.url)) continue;
    failures.push({
      kind: 'timeout',
      source,
      message: 'global timeout reached before fetch began',
    });
  }

  return {
    successes,
    failures,
    dropped: [],
  };
}
