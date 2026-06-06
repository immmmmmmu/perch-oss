// Shared theme contract. Each theme exports a `Theme` describing its metadata
// and a `render(ctx)` function that returns deterministic HTML.
//
// Themes are intentionally framework-agnostic. `@perch/cli` consumes the same
// interface for self-hosted builds.

import type { NormalizedFeed, Post } from '@perch/core';

export type SupportedLocale = 'ja' | 'en';

export interface ThemeProfile {
  readonly displayName: string;
  readonly bio?: string;
  readonly bioHtml?: string;
  readonly avatarUrl?: string;
  readonly links?: readonly {
    readonly label: string;
    readonly href: string;
    readonly description?: string;
  }[];
}

export interface ThemeSite {
  readonly title?: string;
  readonly description?: string;
  readonly url?: string;
  readonly ogImage?: string;
  readonly favicon?: string;
  readonly twitterHandle?: string;
}

export interface ThemeContext {
  readonly profile: ThemeProfile;
  readonly feed: NormalizedFeed;
  readonly locale: SupportedLocale;
  readonly site?: ThemeSite;
  /** perch ブログ機能で書かれた記事。テーマは showInTimeline=true 想定で表示する。 */
  readonly posts?: readonly Post[];
  /** posts ページ用のページング情報。一覧ページ生成時に renderer から渡される。 */
  readonly postsPage?: {
    readonly page: number;
    readonly perPage: number;
    readonly totalPages: number;
  };
}

export interface PostPageContext {
  readonly profile: ThemeProfile;
  readonly site?: ThemeSite;
  readonly locale: SupportedLocale;
  readonly post: Post;
}

export interface ThemeMeta {
  readonly id: string;
  readonly displayName: { readonly ja: string; readonly en: string };
  /** All bundled themes are available for free. */
  readonly plan: 'free' | 'pro';
}

export interface Theme {
  readonly meta: ThemeMeta;
  render(ctx: ThemeContext): string;
  /** 記事一覧ページ HTML。posts が空ならテーマは「記事はまだありません」を出す。 */
  renderPostsIndexPage?(ctx: ThemeContext): string;
  /** 単一記事ページ HTML */
  renderPostPage?(ctx: PostPageContext): string;
  /** RSS XML（テーマからは通常 _shared/posts.ts の renderFeedXml を呼ぶだけ） */
  renderFeedXml?(ctx: ThemeContext): string;
}
