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
  id: 'minimal',
  displayName: { ja: 'ミニマル', en: 'Minimal' },
};

function renderMergedFeed(ctx: ThemeContext): string {
  const profileUrl = ctx.site?.url ?? '';
  const merged = mergeTimeline(ctx.posts ?? [], ctx.feed.items, { profileUrl });

  const items = merged.map((item) => feedItem(item, ctx.locale, 'border-t pt-3')).join('');

  return `<section><h2 class="font-semibold mt-6 mb-2">${escapeHtml(feedHeading(ctx.locale))}</h2>
<ul class="space-y-4">${items}</ul></section>`;
}

export function render(ctx: ThemeContext): string {
  const content = `<main class="max-w-xl mx-auto px-4 py-10 font-sans antialiased">
${profileHeader(ctx, 'mb-8', 'text-2xl font-bold', 'text-base mt-2')}
${linksSection(ctx, 'space-y-1', '')}
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
  const list = renderPostList(posts, ctx.locale, 'space-y-6', 'border-t pt-4');
  const content = `<main class="max-w-xl mx-auto px-4 py-10 font-sans antialiased">
<header class="mb-6 border-b pb-4">
<h1 class="text-2xl font-bold">${escapeHtml(postsHeading(ctx.locale))}</h1>
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
  const content = `<main class="max-w-xl mx-auto px-4 py-10 font-sans antialiased">
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
