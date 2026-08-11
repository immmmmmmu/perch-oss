import { mergeTimeline } from '@perch-app/core';
import {
  escapeAttr,
  escapeHtml,
  feedHeading,
  formatPostDate,
  htmlShell,
  postImage,
  postsHeading,
  renderFeedXml as sharedRenderFeedXml,
  renderPostBody,
  renderPostList,
  sourceLabel,
  type Theme,
  type ThemeContext,
  type PostPageContext,
} from '@perch-app/themes-shared';

import type { NormalizedItem } from '@perch-app/core';

export const meta: Theme['meta'] = {
  id: 'editorial',
  displayName: { ja: 'エディトリアル', en: 'Editorial' },
};

function renderProfile(ctx: ThemeContext): string {
  const avatar = ctx.profile.avatarUrl
    ? `<img src="${escapeAttr(ctx.profile.avatarUrl)}" alt="" class="h-20 w-20 rounded-full object-cover ring-1 ring-stone-300" />`
    : '';
  const bio = ctx.profile.bioHtml
    ? `<div class="perch-profile-body max-w-2xl text-lg leading-8 text-stone-700">${ctx.profile.bioHtml}</div>`
    : ctx.profile.bio
      ? `<p class="max-w-2xl text-lg leading-8 text-stone-700">${escapeHtml(ctx.profile.bio)}</p>`
      : '';
  const links = renderProfileLinks(ctx);

  return `<header class="border-b border-stone-300 pb-10 sm:pb-12">
<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
<div class="space-y-6">
${avatar}
<div class="space-y-4">
<p class="text-xs font-semibold uppercase text-stone-500">Profile</p>
<h1 class="perch-editorial-title max-w-3xl text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">${escapeHtml(ctx.profile.displayName)}</h1>
${bio}
</div>
</div>
${links}
</div>
</header>`;
}

function renderProfileLinks(ctx: ThemeContext): string {
  const links = ctx.profile.links ?? [];
  if (links.length === 0) return '';

  const items = links
    .map((link) => {
      const description = link.description
        ? `<p class="mt-1 text-sm leading-6 text-stone-600">${escapeHtml(link.description)}</p>`
        : '';
      return `<li class="min-w-0">
<a href="${escapeAttr(link.href)}" class="perch-editorial-link text-sm font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4 transition hover:decoration-stone-950" rel="noopener" target="_blank">${escapeHtml(link.label)}</a>
${description}
</li>`;
    })
    .join('');

  return `<nav aria-label="Profile links" class="border-t border-stone-200 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-1">
<ul class="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-1">${items}</ul>
</nav>`;
}

function renderPost(item: NormalizedItem, ctx: ThemeContext): string {
  const image = postImage(
    item,
    'aspect-[16/10] w-full rounded-md object-cover ring-1 ring-stone-200 sm:w-52',
  );
  const label = sourceLabel(item);
  const source = label ? `<span>${escapeHtml(label)}</span><span aria-hidden="true">/</span>` : '';
  const summary = item.summary
    ? `<p class="mt-3 max-w-2xl text-sm leading-6 text-stone-600">${escapeHtml(item.summary)}</p>`
    : '';
  const localeAttr = item.locale ? ` lang="${escapeAttr(item.locale)}"` : '';
  const rowClass = image
    ? 'grid gap-5 border-b border-stone-200 py-6 sm:grid-cols-[minmax(0,1fr)_13rem]'
    : 'grid gap-5 border-b border-stone-200 py-6';

  return `<li class="${rowClass}"${localeAttr}>
<article class="min-w-0">
<div class="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase text-stone-500">
${source}<time datetime="${escapeAttr(item.publishedAt)}">${escapeHtml(formatPostDate(item.publishedAt, ctx.locale))}</time>
</div>
<h3 class="perch-editorial-title text-xl font-semibold leading-snug text-stone-950">
<a href="${escapeAttr(item.url)}" class="decoration-stone-400 decoration-1 underline-offset-4 hover:underline" rel="noopener" target="_blank">${escapeHtml(item.title)}</a>
</h3>
${summary}
</article>
${image ? `<a href="${escapeAttr(item.url)}" rel="noopener" target="_blank" aria-hidden="true" tabindex="-1">${image}</a>` : ''}
</li>`;
}

function renderPosts(ctx: ThemeContext): string {
  const profileUrl = ctx.site?.url ?? '';
  const merged = mergeTimeline(ctx.posts ?? [], ctx.feed.items, { profileUrl });
  const visible = ctx.timeline?.maxItems ? merged.slice(0, ctx.timeline.maxItems) : merged;

  const posts = visible.map((item) => renderPost(item, ctx)).join('');

  return `<section class="pt-8">
<div class="mb-2">
<h2 class="text-sm font-semibold uppercase text-stone-500">${escapeHtml(feedHeading(ctx.locale))}</h2>
</div>
<ul>${posts}</ul>
</section>`;
}

export function render(ctx: ThemeContext): string {
  const content = `<main class="mx-auto max-w-4xl px-5 py-10 font-serif antialiased sm:px-8 sm:py-14">
${renderProfile(ctx)}
${renderPosts(ctx)}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: ctx.profile.displayName,
    bodyClass: 'min-h-screen bg-stone-50 text-stone-950',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostsIndexPage(ctx: ThemeContext): string {
  const posts = ctx.posts ?? [];
  const list = renderPostList(posts, ctx.locale, 'space-y-8', 'border-b border-stone-200 pb-6');
  const content = `<main class="mx-auto max-w-3xl px-5 py-10 font-serif antialiased sm:px-8 sm:py-14">
<header class="mb-8 border-b border-stone-300 pb-6">
<h1 class="text-3xl font-semibold text-stone-950">${escapeHtml(postsHeading(ctx.locale))}</h1>
</header>
${list}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${postsHeading(ctx.locale)} — ${ctx.profile.displayName}`,
    bodyClass: 'min-h-screen bg-stone-50 text-stone-950',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostPage(ctx: PostPageContext): string {
  const content = `<main class="mx-auto max-w-3xl px-5 py-10 font-serif antialiased sm:px-8 sm:py-14">
${renderPostBody(ctx)}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${ctx.post.title} — ${ctx.profile.displayName}`,
    bodyClass: 'min-h-screen bg-stone-50 text-stone-950',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderFeedXml(ctx: ThemeContext): string {
  return sharedRenderFeedXml(ctx);
}

const theme: Theme = {
  meta,
  render,
  renderPostsIndexPage,
  renderPostPage,
  renderFeedXml,
};
export default theme;
