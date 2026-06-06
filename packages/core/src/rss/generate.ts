import type { Post } from '../post/index.js';

export interface GenerateRssOptions {
  readonly profileUrl: string; // 'https://imds.perch.app'
  readonly feedTitle: string;
  readonly feedDescription?: string;
  readonly language: 'ja' | 'en';
}

const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => XML_ESCAPE[ch] ?? ch);
}

function toRfc822(yyyyMmDd: string): string {
  // publishedAt は YYYY-MM-DD なので 00:00:00 UTC として扱う
  const d = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  return d.toUTCString();
}

function renderItem(post: Post, opts: GenerateRssOptions): string {
  const localePrefix = post.locale === 'ja' ? '' : `/${post.locale}`;
  const url = `${opts.profileUrl}${localePrefix}/posts/${post.slug}`;
  const description = post.description ?? post.excerpt;
  return [
    '<item>',
    `<title>${escapeXml(post.title)}</title>`,
    `<link>${escapeXml(url)}</link>`,
    `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `<pubDate>${toRfc822(post.publishedAt)}</pubDate>`,
    `<description>${escapeXml(description)}</description>`,
    `<content:encoded><![CDATA[${post.bodyHtml.replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>`,
    '</item>',
  ].join('\n');
}

export function generateRss(posts: readonly Post[], opts: GenerateRssOptions): string {
  const items = posts.map((p) => renderItem(p, opts)).join('\n');
  const description = opts.feedDescription
    ? `<description>${escapeXml(opts.feedDescription)}</description>`
    : '<description></description>';
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '<channel>',
    `<title>${escapeXml(opts.feedTitle)}</title>`,
    `<link>${escapeXml(opts.profileUrl)}</link>`,
    description,
    `<language>${escapeXml(opts.language)}</language>`,
    items,
    '</channel>',
    '</rss>',
  ].join('\n');
}
