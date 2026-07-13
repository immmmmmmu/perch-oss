import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { FsOgStore } from '../src/storage/FsOgStore.js';

import type { OgMetadata } from '@perch-app/core';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'perch-cli-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('FsOgStore', () => {
  it('returns undefined for missing key', async () => {
    const store = new FsOgStore(join(tmpDir, '.perch/cache/og'));
    expect(await store.get('nonexistent')).toBeUndefined();
  });

  it('stores and retrieves OG metadata', async () => {
    const store = new FsOgStore(join(tmpDir, '.perch/cache/og'));
    const meta: OgMetadata = {
      url: 'https://example.com/article',
      title: 'Test Article',
      description: 'A test article',
      fetchedAt: new Date().toISOString(),
    };
    await store.put('abc123', meta, 3_600_000);
    const retrieved = await store.get('abc123');
    expect(retrieved).toEqual(meta);
  });

  it('creates nested cache directory automatically', async () => {
    const store = new FsOgStore(join(tmpDir, '.perch/cache/og'));
    const meta: OgMetadata = {
      url: 'https://example.com',
      fetchedAt: new Date().toISOString(),
    };
    await expect(store.put('key1', meta, 3_600_000)).resolves.not.toThrow();
    expect(await store.get('key1')).toEqual(meta);
  });

  it('overwrites existing entry on re-put', async () => {
    const store = new FsOgStore(join(tmpDir, '.perch/cache/og'));
    const meta1: OgMetadata = {
      url: 'https://a.com',
      title: 'First',
      fetchedAt: '2026-01-01T00:00:00Z',
    };
    const meta2: OgMetadata = {
      url: 'https://a.com',
      title: 'Second',
      fetchedAt: '2026-01-02T00:00:00Z',
    };
    await store.put('k', meta1, 3_600_000);
    await store.put('k', meta2, 3_600_000);
    expect(await store.get('k')).toEqual(meta2);
  });
});
