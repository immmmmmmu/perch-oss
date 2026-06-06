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
  id: 'grid',
  displayName: { ja: 'グリッド', en: 'Grid' },
  plan: 'free',
};

function renderMergedFeed(ctx: ThemeContext): string {
  const profileUrl = ctx.site?.url ?? '';
  const merged = mergeTimeline(ctx.posts ?? [], ctx.feed.items, { profileUrl });

  const items = merged.map((item) => feedItem(item, ctx.locale, 'border rounded-md p-4')).join('');

  return `<section><h2 class="font-semibold mt-6 mb-2">${escapeHtml(feedHeading(ctx.locale))}</h2>
<ul class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">${items}</ul></section>`;
}

export function render(ctx: ThemeContext): string {
  const content = `<main class="max-w-5xl mx-auto px-6 py-12 font-sans antialiased">
${profileHeader(ctx, 'mb-8 text-center', 'text-3xl font-bold', 'text-base mt-2 max-w-prose mx-auto')}
${linksSection(ctx, 'flex flex-wrap gap-3 justify-center', 'px-3 py-1 border rounded-full')}
${renderMergedFeed(ctx)}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: ctx.profile.displayName,
    bodyClass: 'bg-white text-neutral-900',
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
    'grid grid-cols-1 md:grid-cols-2 gap-6',
    'border rounded-md p-4',
  );
  const content = `<main class="max-w-5xl mx-auto px-6 py-12 font-sans antialiased">
<header class="mb-8 border-b pb-4">
<h1 class="text-3xl font-bold">${escapeHtml(postsHeading(ctx.locale))}</h1>
</header>
${list}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${postsHeading(ctx.locale)} — ${ctx.profile.displayName}`,
    bodyClass: 'bg-white text-neutral-900',
    themeId: meta.id,
    site: ctx.site,
    content,
  });
}

export function renderPostPage(ctx: PostPageContext): string {
  const content = `<main class="max-w-3xl mx-auto px-6 py-12 font-sans antialiased">
${renderPostBody(ctx)}
</main>`;
  return htmlShell({
    locale: ctx.locale,
    title: `${ctx.post.title} — ${ctx.profile.displayName}`,
    bodyClass: 'bg-white text-neutral-900',
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
