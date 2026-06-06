import { parseFrontmatter } from './parseFrontmatter.js';
import { renderHtml } from './renderHtml.js';
import { renderMarkdown } from './renderMarkdown.js';

import type { LoadPostsResult, Post, PostLoadError } from './types.js';
import type { PerchConfig } from '../config/index.js';

export interface PostSource {
  /** posts/ ディレクトリからの相対パス（例: './posts/2026-05-12-hello.ja.md'） */
  readonly path: string;
  readonly content: string;
}

const FILENAME_PATTERN =
  /(?:^|\/)(_?)(?:\d{4}-\d{2}-\d{2}-)?([a-z0-9][a-z0-9-]*)(?:\.(ja|en))?\.(md|html)$/;

function deriveFromFilename(path: string): {
  readonly leadingUnderscore: boolean;
  readonly slug: string | undefined;
  readonly locale: 'ja' | 'en' | undefined;
} {
  const m = FILENAME_PATTERN.exec(path);
  if (!m) return { leadingUnderscore: false, slug: undefined, locale: undefined };
  return {
    leadingUnderscore: m[1] === '_',
    slug: m[2],
    locale: m[3] === 'ja' || m[3] === 'en' ? m[3] : undefined,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeExcerpt(bodyHtml: string, description: string | undefined, max = 160): string {
  if (description) return description;
  const firstP = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(bodyHtml);
  const text = firstP ? stripHtml(firstP[1] ?? '') : stripHtml(bodyHtml);
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}

export async function loadPosts(
  sources: readonly PostSource[],
  config: PerchConfig,
): Promise<LoadPostsResult> {
  const posts: Post[] = [];
  const errors: PostLoadError[] = [];

  for (const src of sources) {
    const filename = deriveFromFilename(src.path);
    if (filename.leadingUnderscore) continue; // _-prefixed files are drafts

    const parsed = parseFrontmatter(src.content);
    if (!parsed.ok) {
      errors.push({ sourcePath: src.path, reason: parsed.error.message });
      continue;
    }

    const fm = parsed.value.frontmatter;
    if (fm.draft) continue;

    const slug = fm.slug ?? filename.slug;
    if (!slug) {
      errors.push({
        sourcePath: src.path,
        reason: 'unable to derive slug from frontmatter or filename',
      });
      continue;
    }

    const locale = fm.locale ?? filename.locale ?? config.locale;

    let bodyHtml: string;
    try {
      bodyHtml =
        fm.format === 'html'
          ? await renderHtml(parsed.value.body)
          : await renderMarkdown(parsed.value.body);
    } catch (e) {
      errors.push({
        sourcePath: src.path,
        reason: e instanceof Error ? e.message : 'render failure',
      });
      continue;
    }

    posts.push({
      slug,
      locale,
      title: fm.title,
      description: fm.description,
      publishedAt: fm.publishedAt,
      updatedAt: fm.updatedAt,
      tags: fm.tags,
      coverImage: fm.coverImage,
      canonicalUrl: fm.canonicalUrl,
      draft: fm.draft,
      bodyHtml,
      excerpt: makeExcerpt(bodyHtml, fm.description),
      sourcePath: src.path,
    });
  }

  posts.sort((a, b) => {
    if (a.publishedAt !== b.publishedAt) {
      return a.publishedAt < b.publishedAt ? 1 : -1;
    }
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });

  return { posts, errors };
}
