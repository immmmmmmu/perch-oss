import { mergeTimeline } from '@perch/core';
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
} from '@perch/themes-shared';

export const meta: Theme['meta'] = {
  id: 'card',
  displayName: { ja: 'カード', en: 'Card' },
  plan: 'free',
};

function renderMergedFeed(ctx: ThemeContext): string {
  const profileUrl = ctx.site?.url ?? '';
  const merged = mergeTimeline(ctx.posts ?? [], ctx.feed.items, { profileUrl });

  const items = merged
    .map((item) => feedItem(item, ctx.locale, 'border rounded-md p-4 hover:shadow-md transition'))
    .join('');

  return `<section><h2 class="font-semibold mt-6 mb-2">${escapeHtml(feedHeading(ctx.locale))}</h2>
<ul class="space-y-4 mt-4">${items}</ul></section>`;
}

export function render(ctx: ThemeContext): string {
  const content = `<main class="max-w-2xl mx-auto px-4 py-12 font-sans antialiased">
<div class="bg-white shadow-xl rounded-2xl p-8">
${profileHeader(ctx, 'mb-6 text-center', 'text-2xl font-bold', 'text-base mt-2 text-neutral-700')}
${linksSection(ctx, 'space-y-2', 'border rounded-md px-3 py-2')}
${renderMergedFeed(ctx)}
</div></main>`;
  return htmlShell({
    locale: ctx.locale,
    title: ctx.profile.displayName,
    bodyClass: 'bg-gradient-to-br from-sky-50 to-violet-50 text-neutral-900 min-h-screen',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostsIndexPage(ctx: ThemeContext): string {
  const posts = ctx.posts ?? [];
  const list = renderPostList(posts, ctx.locale, 'space-y-6', 'bg-white shadow rounded-2xl p-6');
  const content = `<main class="max-w-2xl mx-auto px-4 py-12 font-sans antialiased">
<div class="bg-white shadow-xl rounded-2xl p-8">
<header class="mb-6">
<h1 class="text-2xl font-bold">${escapeHtml(postsHeading(ctx.locale))}</h1>
</header>
${list}
</div></main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${postsHeading(ctx.locale)} — ${ctx.profile.displayName}`,
    bodyClass: 'bg-gradient-to-br from-sky-50 to-violet-50 text-neutral-900 min-h-screen',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostPage(ctx: PostPageContext): string {
  const content = `<main class="max-w-2xl mx-auto px-4 py-12 font-sans antialiased">
<div class="bg-white shadow-xl rounded-2xl p-8">
${renderPostBody(ctx)}
</div></main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${ctx.post.title} — ${ctx.profile.displayName}`,
    bodyClass: 'bg-gradient-to-br from-sky-50 to-violet-50 text-neutral-900 min-h-screen',
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
