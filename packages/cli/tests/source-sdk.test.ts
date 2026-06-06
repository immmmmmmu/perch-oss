import { describe, it, expect } from 'vitest';

import { githubReleasesSource } from '../src/source-sdk.js';

import type { NormalizedFeed } from '@perch/core';

describe('githubReleasesSource', () => {
  it('has correct source id', () => {
    expect(githubReleasesSource.id).toBe('github-releases');
  });

  it('fetches releases and returns NormalizedFeed', async () => {
    const mockRelease = {
      id: 12345,
      html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
      tag_name: 'v1.0.0',
      name: 'Release v1.0.0',
      body: 'Some release notes',
      published_at: '2026-01-15T00:00:00Z',
      author: { login: 'testuser' },
    };

    const fakeFetch: typeof fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify([mockRelease]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const result: NormalizedFeed = await githubReleasesSource.fetch({
      owner: 'owner',
      repo: 'repo',
      fetchImpl: fakeFetch,
    });

    expect(result.source.url).toContain('github.com/owner/repo');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.title).toBe('Release v1.0.0');
    expect(result.items[0]!.url).toBe('https://github.com/owner/repo/releases/tag/v1.0.0');
    expect(result.items[0]!.publishedAt).toBe('2026-01-15T00:00:00Z');
  });

  it('handles API errors gracefully', async () => {
    const fakeFetch: typeof fetch = () =>
      Promise.resolve(new Response('Not Found', { status: 404 }));

    await expect(
      githubReleasesSource.fetch({ owner: 'bad', repo: 'bad', fetchImpl: fakeFetch }),
    ).rejects.toThrow();
  });

  it('returns empty items array for empty releases', async () => {
    const fakeFetch: typeof fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const result = await githubReleasesSource.fetch({
      owner: 'owner',
      repo: 'repo',
      fetchImpl: fakeFetch,
    });
    expect(result.items).toHaveLength(0);
  });
});
