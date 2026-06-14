import type { ThemeMeta } from '@perch/themes-shared';

export interface CliThemeMeta extends ThemeMeta {
  readonly description: { readonly ja: string; readonly en: string };
}

const BUNDLED_THEMES: readonly CliThemeMeta[] = [
  {
    id: 'minimal',
    displayName: { ja: 'ミニマル', en: 'Minimal' },
    description: { ja: '軽量で読みやすいページ', en: 'Lightweight reading-first page' },
  },
  {
    id: 'editorial',
    displayName: { ja: 'エディトリアル', en: 'Editorial' },
    description: { ja: '文章、専門性、信頼感', en: 'Writing, expertise, and trust' },
  },
  {
    id: 'grid',
    displayName: { ja: 'グリッド', en: 'Grid' },
    description: { ja: '画像つき投稿ギャラリー', en: 'Media-rich post gallery' },
  },
  {
    id: 'card',
    displayName: { ja: 'カード', en: 'Card' },
    description: { ja: 'SNS bio 向けリンクと最新投稿', en: 'Social bio links and latest posts' },
  },
  {
    id: 'timeline',
    displayName: { ja: 'タイムライン', en: 'Timeline' },
    description: { ja: '公開活動ログ', en: 'Public activity log' },
  },
];

export function listThemes(): readonly CliThemeMeta[] {
  return BUNDLED_THEMES;
}

export function getThemeMeta(id: string): CliThemeMeta | undefined {
  return BUNDLED_THEMES.find((t) => t.id === id);
}
