import { copyFile, cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import { fetchOg, loadPosts, parseFeed } from '@perch/core';
import cardTheme from '@perch/theme-card';
import editorialTheme from '@perch/theme-editorial';
import gridTheme from '@perch/theme-grid';
import minimalTheme from '@perch/theme-minimal';
import timelineTheme from '@perch/theme-timeline';

import { FsOgStore } from '../storage/FsOgStore.js';

import type { PerchConfig } from '../config-loader.js';
import type { FeedSource, Locale, NormalizedFeed, NormalizedItem, PostSource } from '@perch/core';
import type { Theme, ThemeContext, ThemeProfile, ThemeSite } from '@perch/themes-shared';

const require = createRequire(import.meta.url);

export interface BuildOptions {
  readonly config: PerchConfig;
  readonly configPath?: string;
  readonly outDir: string;
  readonly cacheDir: string;
  readonly publicDir?: string;
  readonly fetchImpl?: typeof fetch;
  readonly extraFeeds?: readonly NormalizedFeed[];
}

async function fetchOneFeed(
  source: FeedSource,
  fetchImpl: typeof fetch,
): Promise<NormalizedFeed | null> {
  try {
    const res = await fetchImpl(source.url, {
      headers: { accept: 'application/rss+xml, application/atom+xml, application/json, */*' },
    });
    if (!res.ok) return null;
    const body = await res.text();
    const { feed } = parseFeed(body, source);
    return feed;
  } catch {
    return null;
  }
}

async function fetchAllFeeds(
  sources: readonly FeedSource[],
  fetchImpl: typeof fetch,
): Promise<NormalizedFeed[]> {
  const results = await Promise.all(sources.map((s) => fetchOneFeed(s, fetchImpl)));
  return results.filter((f): f is NormalizedFeed => f !== null);
}

async function hydrateFeedOgImages(
  feed: NormalizedFeed,
  store: FsOgStore,
  fetchImpl: typeof fetch,
): Promise<NormalizedFeed> {
  const items = await Promise.all(
    feed.items.map(async (item): Promise<NormalizedItem> => {
      if (item.ogImageUrl) return item;
      const og = await fetchOg(item.url, store, { fetchImpl });
      if (!og.imageUrl) return item;
      return { ...item, ogImageUrl: og.imageUrl };
    }),
  );
  return { ...feed, items };
}

async function hydrateFeedsOgImages(
  feeds: readonly NormalizedFeed[],
  store: FsOgStore,
  fetchImpl: typeof fetch,
): Promise<NormalizedFeed[]> {
  return await Promise.all(feeds.map((feed) => hydrateFeedOgImages(feed, store, fetchImpl)));
}

function mergeFeeds(feeds: readonly NormalizedFeed[]): NormalizedFeed {
  const allItems: NormalizedItem[] = [];
  for (const f of feeds) {
    for (const item of f.items) {
      allItems.push(item);
    }
  }
  const sorted = allItems
    .slice()
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return {
    source: feeds[0]?.source ?? { url: 'merged' },
    items: sorted,
    fetchedAt: new Date().toISOString(),
  };
}

const THEMES: Record<string, Theme> = {
  editorial: editorialTheme,
  grid: gridTheme,
  card: cardTheme,
  timeline: timelineTheme,
  minimal: minimalTheme,
};

function loadTheme(themeId: string): Theme {
  return THEMES[themeId] ?? minimalTheme;
}

// Rewrites `./public/foo.png` → `./foo.png` so refs match the deployed layout
// (CLI copies <projectRoot>/public/* into dist/, so files live at dist root).
// Absolute URLs and other paths pass through unchanged.
function rewritePublicPath(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.startsWith('./public/')) return `./${value.slice('./public/'.length)}`;
  if (value.startsWith('public/')) return `./${value.slice('public/'.length)}`;
  return value;
}

function buildThemeProfile(config: PerchConfig): ThemeProfile {
  return {
    displayName: config.profile.name,
    bio: config.profile.bio,
    bioHtml: config.profile.bioHtml,
    avatarUrl: rewritePublicPath(config.profile.avatarUrl),
    links: config.profile.links,
  };
}

function buildThemeSite(config: PerchConfig): ThemeSite | undefined {
  const site = config.site;
  if (!site) return undefined;
  return {
    title: site.title,
    description: site.description,
    url: site.url,
    ogImage: rewritePublicPath(site.ogImage),
    favicon: rewritePublicPath(site.favicon),
    twitterHandle: site.twitterHandle,
  };
}

export async function runBuild(opts: BuildOptions): Promise<void> {
  const {
    config,
    configPath,
    outDir,
    cacheDir,
    fetchImpl = globalThis.fetch.bind(globalThis),
    extraFeeds = [],
  } = opts;

  const store = new FsOgStore(join(cacheDir, 'og'));

  const feedSources: readonly FeedSource[] = config.feeds.map((f) => ({
    url: f.url,
    ...(f.name ? { name: f.name } : {}),
    ...(f.locale ? { locale: f.locale as Locale } : {}),
  }));
  const fetchedFeeds = await fetchAllFeeds(feedSources, fetchImpl);
  const allFeeds = await hydrateFeedsOgImages([...fetchedFeeds, ...extraFeeds], store, fetchImpl);

  const emptyFeed: NormalizedFeed = {
    source: { url: 'empty' },
    items: [],
    fetchedAt: new Date().toISOString(),
  };

  const mergedFeed = allFeeds.length > 0 ? mergeFeeds(allFeeds) : emptyFeed;

  // Resolve project root from configPath if provided, otherwise fall back to cwd
  const projectRoot = configPath ? dirname(configPath) : process.cwd();

  // Load posts if enabled
  const postSources: readonly PostSource[] = config.posts.enabled
    ? await gatherPostSources(resolve(projectRoot, config.posts.dir))
    : [];
  const { posts, errors: postErrors } = await loadPosts(postSources, config);
  for (const err of postErrors) {
    process.stderr.write(`[warn] ${err.sourcePath}: ${err.reason}\n`);
  }

  const themeProfile = buildThemeProfile(config);
  const themeSite = buildThemeSite(config);
  const locale = config.locale ?? 'ja';
  const themeId = config.theme ?? 'minimal';
  const theme = loadTheme(themeId);

  const ctx: ThemeContext = {
    profile: themeProfile,
    feed: mergedFeed,
    locale,
    site: themeSite,
    posts: posts.length > 0 ? posts : undefined,
  };

  const html = theme.render(ctx);

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), html, 'utf8');
  await copyThemeStyle(themeId, outDir);
  if (opts.publicDir) await copyPublicDir(opts.publicDir, outDir);

  // Generate posts pages, RSS feed, and copy assets when posts are enabled
  if (config.posts.enabled && posts.length > 0) {
    if (theme.renderPostsIndexPage) {
      const indexPageHtml = theme.renderPostsIndexPage(ctx);
      await mkdir(join(outDir, 'posts'), { recursive: true });
      await writeFile(join(outDir, 'posts', 'index.html'), indexPageHtml, 'utf8');
    }

    if (theme.renderPostPage) {
      for (const post of posts) {
        const postDir = join(outDir, 'posts', post.slug);
        await mkdir(postDir, { recursive: true });
        const postHtml = theme.renderPostPage({
          profile: themeProfile,
          site: themeSite,
          locale: post.locale,
          post,
        });
        await writeFile(join(postDir, 'index.html'), postHtml, 'utf8');
      }
    }

    if (theme.renderFeedXml) {
      const xml = theme.renderFeedXml(ctx);
      await writeFile(join(outDir, 'feed.xml'), xml, 'utf8');
    }
  }

  if (config.posts.enabled) {
    const assetsSrc = resolve(projectRoot, config.posts.assetsDir);
    const assetsOut = join(outDir, 'assets');
    try {
      await copyDirectory(assetsSrc, assetsOut);
    } catch {
      // assets directory is optional — skip if missing
    }
  }
}

async function gatherPostSources(postsDir: string): Promise<readonly PostSource[]> {
  let entries: string[];
  try {
    entries = await readdir(postsDir);
  } catch {
    return [];
  }
  const sources: PostSource[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.md') && !entry.endsWith('.html')) continue;
    if (entry.startsWith('_')) continue; // ignore drafts
    const full = join(postsDir, entry);
    const content = await readFile(full, 'utf8');
    sources.push({ path: `./posts/${entry}`, content });
  }
  return sources;
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true });
  await mkdir(dest, { recursive: true });
  for (const entry of entries) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(s, d);
    } else if (entry.isFile()) {
      await copyFile(s, d);
    }
  }
}

async function copyPublicDir(publicDir: string, outDir: string): Promise<void> {
  try {
    const s = await stat(publicDir);
    if (!s.isDirectory()) return;
  } catch {
    return; // public/ doesn't exist — skip
  }
  await cp(publicDir, outDir, { recursive: true });
}

async function copyThemeStyle(themeId: string, outDir: string): Promise<void> {
  const validThemeId = THEMES[themeId] ? themeId : 'minimal';
  const pkgName = `@perch/theme-${validThemeId}`;
  try {
    const styleSrc = require.resolve(`${pkgName}/style.css`);
    await copyFile(styleSrc, join(outDir, 'style.css'));
  } catch {
    // Theme package was not built yet (no dist/style.css). HTML still works,
    // but the page will render unstyled. Run `pnpm --filter <theme> build` first.
    console.warn(
      `[perch] WARNING: ${pkgName}/style.css not found. ` +
        `Run "pnpm --filter ${pkgName} build" to generate it.`,
    );
  }
}
