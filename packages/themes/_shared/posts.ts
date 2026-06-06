// テーマ共通の posts レンダリングヘルパー。各テーマは render(ctx) / renderPostPage(ctx)
// などからこれらを呼び、テーマ固有のラッパー HTML / class 名で囲う。

import { generateRss } from '@perch/core';

import { escapeAttr, escapeHtml, formatPostDate } from './render.js';

import type { PostPageContext, SupportedLocale, ThemeContext } from './types.js';
import type { Post } from '@perch/core';

const I18N_POSTS_HEADING: Record<SupportedLocale, string> = {
  ja: '記事',
  en: 'Posts',
};
const I18N_NO_POSTS: Record<SupportedLocale, string> = {
  ja: 'まだ記事がありません。',
  en: 'No posts yet.',
};
const I18N_READ_MORE: Record<SupportedLocale, string> = {
  ja: '続きを読む',
  en: 'Read more',
};

export function postsHeading(locale: SupportedLocale): string {
  return I18N_POSTS_HEADING[locale];
}

export function noPostsMessage(locale: SupportedLocale): string {
  return I18N_NO_POSTS[locale];
}

export function postPermalink(post: Post): string {
  const localePrefix = post.locale === 'ja' ? '' : `/${post.locale}`;
  return `${localePrefix}/posts/${post.slug}`;
}

/** Posts のリスト（一覧ページとプロフィールトップの両方で使える）。 */
export function renderPostList(
  posts: readonly Post[],
  locale: SupportedLocale,
  listClass: string,
  itemClass: string,
): string {
  if (posts.length === 0) {
    return `<p class="opacity-70">${escapeHtml(noPostsMessage(locale))}</p>`;
  }
  const items = posts
    .map((post) => {
      const cover = post.coverImage
        ? `<img src="${escapeAttr(post.coverImage)}" alt="" loading="lazy" class="mb-3 w-full rounded-md object-cover" />`
        : '';
      const summary = post.excerpt
        ? `<p class="mt-1 text-sm opacity-75">${escapeHtml(post.excerpt)}</p>`
        : '';
      const date = escapeHtml(formatPostDate(post.publishedAt, locale));
      const more = escapeHtml(I18N_READ_MORE[locale]);
      const url = postPermalink(post);
      return `<li class="${escapeAttr(itemClass)}" lang="${escapeAttr(post.locale)}">
${cover}<a href="${escapeAttr(url)}" class="text-base font-semibold hover:underline">${escapeHtml(post.title)}</a>
<div class="text-xs opacity-60"><time datetime="${escapeAttr(post.publishedAt)}">${date}</time></div>
${summary}
<a href="${escapeAttr(url)}" class="mt-2 inline-block text-xs underline opacity-70 hover:opacity-100">${more} →</a></li>`;
    })
    .join('');
  return `<ul class="${escapeAttr(listClass)}">${items}</ul>`;
}

/** 単一記事の <article> 本文。post.bodyHtml は @perch/core 側で sanitize 済み。 */
export function renderPostBody(ctx: PostPageContext): string {
  const post = ctx.post;
  const cover = post.coverImage
    ? `<img src="${escapeAttr(post.coverImage)}" alt="" class="mb-6 w-full rounded-md" />`
    : '';
  const canonical = post.canonicalUrl
    ? `<p class="mt-6 text-sm opacity-70">Originally published at <a href="${escapeAttr(post.canonicalUrl)}" rel="canonical noopener" target="_blank" class="underline">${escapeHtml(post.canonicalUrl)}</a></p>`
    : '';
  const updated = post.updatedAt
    ? ` <span class="opacity-70">/ updated <time datetime="${escapeAttr(post.updatedAt)}">${escapeHtml(formatPostDate(post.updatedAt, ctx.locale))}</time></span>`
    : '';
  return `<article class="prose mx-auto max-w-3xl" lang="${escapeAttr(post.locale)}">
<header class="mb-6">
<h1 class="text-3xl font-bold">${escapeHtml(post.title)}</h1>
<div class="mt-2 text-sm opacity-70"><time datetime="${escapeAttr(post.publishedAt)}">${escapeHtml(formatPostDate(post.publishedAt, ctx.locale))}</time>${updated}</div>
</header>
${cover}
<div class="perch-post-body">${post.bodyHtml}</div>
${canonical}
</article>`;
}

/** RSS 2.0 を返す。テーマからは renderFeedXml(ctx) として呼ぶ。 */
export function renderFeedXml(ctx: ThemeContext): string {
  const profileUrl = ctx.site?.url ?? '';
  return generateRss(ctx.posts ?? [], {
    profileUrl,
    feedTitle: ctx.site?.title ?? ctx.profile.displayName,
    feedDescription: ctx.site?.description,
    language: ctx.locale,
  });
}
