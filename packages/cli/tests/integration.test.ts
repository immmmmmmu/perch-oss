import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineSource } from '@perch/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import { runBuild } from '../src/commands/build.js';

import type { PerchConfig } from '../src/config-loader.js';
import type { NormalizedFeed } from '@perch/core';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'perch-integration-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('defineSource adapter integration', () => {
  it('custom source injects items into build pipeline', async () => {
    const customSource = defineSource({
      id: 'test-custom',
      configSchema: z.object({ label: z.string() }),
      fetch(config): Promise<NormalizedFeed> {
        return Promise.resolve({
          source: { url: 'custom://test', name: config.label },
          items: [
            {
              id: 'custom-item-1',
              url: 'https://example.com/custom-1',
              title: 'Custom Source Item Title',
              publishedAt: '2026-01-01T00:00:00Z',
              source: { url: 'custom://test', name: config.label },
            },
          ],
          fetchedAt: new Date().toISOString(),
        });
      },
    });

    const customFeed = await customSource.fetch({ label: 'My Custom Source' });

    const config: PerchConfig = {
      profile: { name: 'Integration Test User' },
      locale: 'en',
      theme: 'minimal',
      feeds: [],
      posts: {
        enabled: false,
        dir: './posts',
        assetsDir: './assets',
        perPage: 10,
        showInTimeline: true,
      },
    };

    const outDir = join(tmpDir, 'dist');
    await runBuild({
      config,
      outDir,
      cacheDir: join(tmpDir, '.perch/cache'),
      extraFeeds: [customFeed],
    });

    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('Custom Source Item Title');
    expect(html).toContain('Integration Test User');
  });

  it('githubReleasesSource with defineSource produces valid feed structure', async () => {
    const { githubReleasesSource } = await import('../src/source-sdk.js');

    const mockRelease = {
      id: 99,
      html_url: 'https://github.com/test/repo/releases/tag/v2.0',
      tag_name: 'v2.0',
      name: 'Version 2.0 Release',
      body: 'Release notes here',
      published_at: '2026-03-01T00:00:00Z',
      author: { login: 'releaser' },
    };

    const fakeFetch: typeof fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify([mockRelease]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const feed = await githubReleasesSource.fetch({
      owner: 'test',
      repo: 'repo',
      fetchImpl: fakeFetch,
    });

    const config: PerchConfig = {
      profile: { name: 'Release Tracker' },
      locale: 'en',
      theme: 'minimal',
      feeds: [],
      posts: {
        enabled: false,
        dir: './posts',
        assetsDir: './assets',
        perPage: 10,
        showInTimeline: true,
      },
    };

    const outDir = join(tmpDir, 'dist');
    await runBuild({
      config,
      outDir,
      cacheDir: join(tmpDir, '.perch/cache'),
      extraFeeds: [feed],
    });

    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('Version 2.0 Release');
  });
});
