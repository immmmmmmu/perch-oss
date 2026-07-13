import { defineSource } from '@perch-app/core';
import { z } from 'zod';

import type { NormalizedFeed } from '@perch-app/core';

const githubReleaseConfigSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  fetchImpl: z.function().optional(),
});

type GitHubReleaseConfig = z.infer<typeof githubReleaseConfigSchema>;

interface GitHubRelease {
  readonly id: number;
  readonly html_url: string;
  readonly tag_name: string;
  readonly name: string | null;
  readonly body: string | null;
  readonly published_at: string;
  readonly author: { readonly login: string } | null;
}

export const githubReleasesSource = defineSource<GitHubReleaseConfig>({
  id: 'github-releases',
  configSchema: githubReleaseConfigSchema,
  async fetch(config): Promise<NormalizedFeed> {
    const { owner, repo, fetchImpl = globalThis.fetch.bind(globalThis) } = config;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases`;
    const sourceUrl = `https://github.com/${owner}/${repo}/releases`;

    const res = await (fetchImpl as typeof fetch)(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      throw new Error(`github-releases: HTTP ${String(res.status)} fetching ${apiUrl}`);
    }

    const releases = (await res.json()) as GitHubRelease[];
    const fetchedAt = new Date().toISOString();

    const items = releases.map((r) => ({
      id: String(r.id),
      url: r.html_url,
      title: r.name ?? r.tag_name,
      publishedAt: r.published_at,
      ...(r.body ? { summary: r.body.slice(0, 300) } : {}),
      ...(r.author ? { authors: [r.author.login] as readonly string[] } : {}),
      source: { url: sourceUrl, name: `${owner}/${repo} releases` },
    }));

    return {
      source: { url: sourceUrl, name: `${owner}/${repo} releases` },
      items,
      fetchedAt,
    };
  },
});
