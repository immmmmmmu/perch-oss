import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const postFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  publishedAt: z.string().regex(DATE_PATTERN, 'expected YYYY-MM-DD'),
  slug: z.string().regex(SLUG_PATTERN).optional(),
  description: z.string().max(300).optional(),
  locale: z.enum(['ja', 'en']).optional(),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  updatedAt: z.string().regex(DATE_PATTERN).optional(),
  format: z.enum(['markdown', 'html']).default('markdown'),
  canonicalUrl: z.string().url().optional(),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = Readonly<z.infer<typeof postFrontmatterSchema>>;

export interface Post {
  /** 確定済み slug (frontmatter または filename から導出) */
  readonly slug: string;
  /** 確定済み locale (frontmatter / filename サフィックス / config.locale の順) */
  readonly locale: 'ja' | 'en';
  readonly title: string;
  readonly description?: string;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly tags: readonly string[];
  readonly coverImage?: string;
  readonly canonicalUrl?: string;
  readonly draft: boolean;
  /** sanitize 済み HTML body */
  readonly bodyHtml: string;
  /** body 先頭 ~160 字から自動抽出した要約（description が無いときの fallback） */
  readonly excerpt: string;
  /** 元 markdown / html ファイルのパス (デバッグ用、相対) */
  readonly sourcePath: string;
}

export interface PostLoadError {
  readonly sourcePath: string;
  readonly reason: string;
}

export interface LoadPostsResult {
  readonly posts: readonly Post[];
  readonly errors: readonly PostLoadError[];
}
