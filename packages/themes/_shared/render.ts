// Common HTML helpers shared by every theme. Centralised so themes look
// consistent for accessibility / OGP / hreflang and so tests can lock down a
// single golden HTML structure.

import type { SupportedLocale, ThemeContext, ThemeSite } from './types.js';
import type { NormalizedFeed, NormalizedItem } from '@perch-app/core';

const I18N_FEED_HEADING: Record<SupportedLocale, string> = {
  ja: '最新の発信',
  en: 'Latest posts',
};
const I18N_LINKS_HEADING: Record<SupportedLocale, string> = {
  ja: 'リンク',
  en: 'Links',
};

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

export function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export function feedHeading(locale: SupportedLocale): string {
  return I18N_FEED_HEADING[locale];
}

export function linksHeading(locale: SupportedLocale): string {
  return I18N_LINKS_HEADING[locale];
}

export function htmlLang(locale: SupportedLocale): string {
  return locale;
}

export function formatPostDate(value: string, locale: SupportedLocale): string {
  return new Date(value).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function sourceLabel(item: NormalizedItem): string | undefined {
  if (item.source.name) return item.source.name;
  try {
    return new URL(item.source.url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function postImage(item: NormalizedItem, className: string): string {
  if (!item.ogImageUrl) return '';
  return `<img src="${escapeAttr(item.ogImageUrl)}" alt="" loading="lazy" class="${escapeAttr(className)}" />`;
}

export function actionLinks(ctx: ThemeContext, listClass: string, itemClass: string): string {
  const links = ctx.profile.links ?? [];
  if (links.length === 0) return '';
  const items = links
    .map(
      (l) =>
        `<li><a href="${escapeAttr(l.href)}" class="${escapeAttr(itemClass)}" rel="noopener" target="_blank">${escapeHtml(l.label)}</a></li>`,
    )
    .join('');
  return `<ul class="${escapeAttr(listClass)}">${items}</ul>`;
}

export function htmlShell(opts: {
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly bodyClass: string;
  readonly themeId: string;
  readonly content: string;
  readonly site?: ThemeSite;
}): string {
  const site = opts.site ?? {};
  const ogTitle = site.title ?? opts.title;
  const ogDescription = site.description;
  const ogImage = site.ogImage;
  const ogUrl = site.url;
  const favicon = site.favicon;
  const twitterHandle = site.twitterHandle;

  const tags: string[] = [];
  if (ogDescription)
    tags.push(`<meta name="description" content="${escapeAttr(ogDescription)}" />`);
  if (favicon) tags.push(`<link rel="icon" href="${escapeAttr(favicon)}" />`);
  tags.push(`<meta property="og:title" content="${escapeAttr(ogTitle)}" />`);
  if (ogDescription)
    tags.push(`<meta property="og:description" content="${escapeAttr(ogDescription)}" />`);
  if (ogImage) tags.push(`<meta property="og:image" content="${escapeAttr(ogImage)}" />`);
  if (ogUrl) tags.push(`<meta property="og:url" content="${escapeAttr(ogUrl)}" />`);
  tags.push(`<meta property="og:type" content="website" />`);
  tags.push(
    `<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />`,
  );
  if (ogImage) tags.push(`<meta name="twitter:image" content="${escapeAttr(ogImage)}" />`);
  if (twitterHandle)
    tags.push(`<meta name="twitter:creator" content="${escapeAttr(twitterHandle)}" />`);

  const head = tags.join('\n');

  return `<!doctype html><html lang="${escapeAttr(opts.locale)}"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
<meta name="generator" content="@perch-app/theme-${escapeAttr(opts.themeId)}" />
<link rel="stylesheet" href="./style.css" />
${head}
</head><body class="${escapeAttr(opts.bodyClass)}">
${opts.content}
</body></html>`;
}

export function feedItem(item: NormalizedItem, locale: SupportedLocale, itemClass: string): string {
  const localeAttr = item.locale ? ` lang="${escapeAttr(item.locale)}"` : '';
  const summary = item.summary
    ? `<p class="text-sm opacity-75 mt-1">${escapeHtml(item.summary)}</p>`
    : '';
  const og = item.ogImageUrl
    ? `<img src="${escapeAttr(item.ogImageUrl)}" alt="" loading="lazy" class="w-full h-48 object-cover rounded-md mb-3" />`
    : '';
  const date = new Date(item.publishedAt).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US');
  return `<li class="${escapeAttr(itemClass)}"${localeAttr}>
${og}<a href="${escapeAttr(item.url)}" class="font-medium hover:underline" rel="noopener" target="_blank">${escapeHtml(item.title)}</a>
<div class="text-xs opacity-60">${escapeHtml(date)}</div>
${summary}</li>`;
}

export function profileHeader(
  ctx: ThemeContext,
  headerClass: string,
  nameClass: string,
  bioClass: string,
): string {
  const avatar = ctx.profile.avatarUrl
    ? `<img src="${escapeAttr(ctx.profile.avatarUrl)}" alt="" class="w-20 h-20 rounded-full mb-3" />`
    : '';
  const bio = ctx.profile.bio
    ? `<p class="${escapeAttr(bioClass)}">${escapeHtml(ctx.profile.bio)}</p>`
    : '';
  return `<header class="${escapeAttr(headerClass)}">
${avatar}<h1 class="${escapeAttr(nameClass)}">${escapeHtml(ctx.profile.displayName)}</h1>
${bio}</header>`;
}

export function linksSection(ctx: ThemeContext, listClass: string, itemClass: string): string {
  const links = ctx.profile.links ?? [];
  if (links.length === 0) return '';
  const items = links
    .map(
      (l) =>
        `<li class="${escapeAttr(itemClass)}"><a href="${escapeAttr(l.href)}" class="hover:underline" rel="noopener" target="_blank">${escapeHtml(l.label)}</a></li>`,
    )
    .join('');
  return `<section><h2 class="font-semibold mt-6 mb-2">${escapeHtml(linksHeading(ctx.locale))}</h2>
<ul class="${escapeAttr(listClass)}">${items}</ul></section>`;
}

export function feedSection(
  feed: NormalizedFeed,
  locale: SupportedLocale,
  listClass: string,
  itemClass: string,
): string {
  const items = feed.items
    .slice()
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .map((it) => feedItem(it, locale, itemClass))
    .join('');
  return `<section><h2 class="font-semibold mt-6 mb-2">${escapeHtml(feedHeading(locale))}</h2>
<ul class="${escapeAttr(listClass)}">${items}</ul></section>`;
}
