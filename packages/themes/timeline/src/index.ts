import { mergeTimeline } from '@perch-app/core';
import {
  escapeHtml,
  feedHeading,
  feedItem,
  htmlShell,
  linksSection,
  postsHeading,
  profileHeader,
  renderFeedXml as sharedRenderFeedXml,
  renderPostBody,
  renderPostList,
  type Theme,
  type ThemeContext,
  type PostPageContext,
} from '@perch-app/themes-shared';

export const meta: Theme['meta'] = {
  id: 'timeline',
  displayName: { ja: 'タイムライン', en: 'Timeline' },
};

function renderMergedFeed(ctx: ThemeContext): string {
  const profileUrl = ctx.site?.url ?? '';
  const merged = mergeTimeline(ctx.posts ?? [], ctx.feed.items, { profileUrl });

  const itemClass =
    "relative pl-3 before:content-[''] before:absolute before:-left-7 before:top-2 before:w-3 before:h-3 before:rounded-full before:bg-neutral-700";
  const items = merged.map((item) => feedItem(item, ctx.locale, itemClass)).join('');

  return `<section><h2 class="font-semibold mt-6 mb-2">${escapeHtml(feedHeading(ctx.locale))}</h2>
<ul class="mt-6 border-l-2 border-neutral-300 pl-6 space-y-6">${items}</ul></section>`;
}

export function render(ctx: ThemeContext): string {
  const content = `<main class="max-w-2xl mx-auto px-4 py-12 font-mono antialiased">
${profileHeader(ctx, 'mb-10', 'text-2xl font-bold', 'text-base mt-2')}
${linksSection(ctx, 'space-y-1 text-sm', '')}
${renderMergedFeed(ctx)}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: ctx.profile.displayName,
    bodyClass: 'bg-neutral-50 text-neutral-900',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostsIndexPage(ctx: ThemeContext): string {
  const posts = ctx.posts ?? [];
  const list = renderPostList(
    posts,
    ctx.locale,
    'mt-6 border-l-2 border-neutral-300 pl-6 space-y-6',
    'relative pl-3',
  );
  const content = `<main class="max-w-2xl mx-auto px-4 py-12 font-mono antialiased">
<header class="mb-8 border-b border-neutral-300 pb-4">
<h1 class="text-2xl font-bold">${escapeHtml(postsHeading(ctx.locale))}</h1>
</header>
${list}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${postsHeading(ctx.locale)} — ${ctx.profile.displayName}`,
    bodyClass: 'bg-neutral-50 text-neutral-900',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostPage(ctx: PostPageContext): string {
  const content = `<main class="max-w-2xl mx-auto px-4 py-12 font-mono antialiased">
${renderPostBody(ctx)}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${ctx.post.title} — ${ctx.profile.displayName}`,
    bodyClass: 'bg-neutral-50 text-neutral-900',
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
