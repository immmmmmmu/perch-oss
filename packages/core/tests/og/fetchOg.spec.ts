import { describe, expect, it } from 'vitest';

import { fetchOg, type OgMetadata, type OgStore } from '../../src/index.js';

function memoryStore(initial: readonly (readonly [string, OgMetadata])[] = []): OgStore & {
  readonly state: Map<string, OgMetadata>;
  readonly getCalls: { count: number };
  readonly putCalls: { count: number };
} {
  const state = new Map(initial);
  const getCalls = { count: 0 };
  const putCalls = { count: 0 };
  return {
    state,
    getCalls,
    putCalls,
    get(hash) {
      getCalls.count += 1;
      return Promise.resolve(state.get(hash));
    },
    put(hash, value) {
      putCalls.count += 1;
      state.set(hash, value);
      return Promise.resolve();
    },
  };
}

const NOTE_HTML = `<!doctype html><html lang="ja"><head>
  <meta property="og:title" content="記事タイトル &amp; 続き" />
  <meta property="og:description" content="導入文" />
  <meta property="og:image" content="https://cdn.example.com/og.png" />
  <title>noteの記事</title>
</head><body><h1>本文</h1></body></html>`;

const respondWith =
  (body: string, init?: ResponseInit): typeof fetch =>
  () =>
    Promise.resolve(new Response(body, init));

describe('fetchOg', () => {
  it('extracts og:title / description / image', async () => {
    const fetchImpl = respondWith(NOTE_HTML, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const store = memoryStore();
    const og = await fetchOg('https://example.com/post', store, { fetchImpl });
    expect(og.title).toBe('記事タイトル & 続き');
    expect(og.description).toBe('導入文');
    expect(og.imageUrl).toBe('https://cdn.example.com/og.png');
    expect(store.putCalls.count).toBe(1);
  });

  it('returns cached value within ttl without calling fetch', async () => {
    const fetchImpl = countingFetch(() =>
      Promise.resolve(
        new Response(NOTE_HTML, {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    );
    const store = memoryStore();
    await fetchOg('https://cached.example.com/x', store, { fetchImpl });
    const callsAfterFirst = fetchImpl.calls;
    await fetchOg('https://cached.example.com/x', store, { fetchImpl });
    expect(fetchImpl.calls).toBe(callsAfterFirst);
  });

  it('rejects internal IPs without calling fetch', async () => {
    const fetchImpl = countingFetch(() =>
      Promise.resolve(new Response('should not be called', { status: 200 })),
    );
    const store = memoryStore();
    const og = await fetchOg('http://127.0.0.1/', store, { fetchImpl });
    expect(fetchImpl.calls).toBe(0);
    expect(og.title).toBeUndefined();
  });

  it('rejects redirect targets that point back into private space', async () => {
    const fetchImpl = countingFetch((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url === 'https://safe.example.com/r') {
        return Promise.resolve(
          new Response('', { status: 302, headers: { location: 'http://10.0.0.5/admin' } }),
        );
      }
      return Promise.resolve(new Response('admin', { status: 200 }));
    });
    const store = memoryStore();
    const og = await fetchOg('https://safe.example.com/r', store, { fetchImpl });
    expect(og.title).toBeUndefined();
    expect(fetchImpl.calls).toBe(1); // hop blocked before second fetch
  });

  it('truncates response bodies past 256KB', async () => {
    const huge =
      '<html><head><title>X</title></head><body>' + 'a'.repeat(300_000) + '</body></html>';
    const fetchImpl = respondWith(huge, { status: 200 });
    const store = memoryStore();
    const og = await fetchOg('https://big.example.com/page', store, { fetchImpl });
    expect(og.title).toBe('X');
  });

  it('returns a stub record on non-2xx without throwing', async () => {
    const fetchImpl = respondWith('nope', { status: 503 });
    const store = memoryStore();
    const og = await fetchOg('https://flaky.example.com/page', store, { fetchImpl });
    expect(og.title).toBeUndefined();
    expect(og.url).toBe('https://flaky.example.com/page');
  });
});

interface CountingFetch {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  calls: number;
}

function countingFetch(impl: typeof fetch): CountingFetch {
  const wrapped: CountingFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    wrapped.calls += 1;
    return impl(input, init);
  }) as CountingFetch;
  wrapped.calls = 0;
  return wrapped;
}
