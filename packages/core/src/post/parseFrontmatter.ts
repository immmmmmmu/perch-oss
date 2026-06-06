import { load as parseYaml } from 'js-yaml';

import { postFrontmatterSchema } from './types.js';

import type { PostFrontmatter } from './types.js';

export type ParseFrontmatterError =
  | { readonly code: 'missing'; readonly message: string }
  | { readonly code: 'schema'; readonly message: string; readonly issues: readonly string[] };

export type ParseFrontmatterResult =
  | {
      readonly ok: true;
      readonly value: { readonly frontmatter: PostFrontmatter; readonly body: string };
    }
  | { readonly ok: false; readonly error: ParseFrontmatterError };

/**
 * YAML を解析する際、日付文字列が Date オブジェクトに変換される。
 * これを YYYY-MM-DD 形式に戻す。
 */
function normalizeData(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...data };

  for (const [key, value] of Object.entries(normalized)) {
    if (value instanceof Date) {
      // Date を YYYY-MM-DD 形式に変換（UTC 基準）
      const year = value.getUTCFullYear();
      const month = String(value.getUTCMonth() + 1).padStart(2, '0');
      const day = String(value.getUTCDate()).padStart(2, '0');
      normalized[key] = `${year}-${month}-${day}`;
    }
  }

  return normalized;
}

/**
 * Markdown ファイルから YAML frontmatter を抽出してパースする。
 * gray-matter の代わりに js-yaml を直接使うことで CJS/ESM 互換性問題を回避する。
 */
function splitFrontmatter(source: string): { yaml: string; body: string } | null {
  if (!source.trimStart().startsWith('---')) return null;

  const afterFirst = source.trimStart().slice(3);
  // Find closing ---
  const closingMatch = /^---[ \t]*$/m.exec(afterFirst);
  if (!closingMatch) return null;

  const yaml = afterFirst.slice(0, closingMatch.index);
  const body = afterFirst.slice(closingMatch.index + closingMatch[0].length);
  return { yaml, body: body.replace(/^\n/, '') };
}

export function parseFrontmatter(source: string): ParseFrontmatterResult {
  // 明示的に区切り `---` を確認する。
  if (!source.trimStart().startsWith('---')) {
    return {
      ok: false,
      error: { code: 'missing', message: 'frontmatter block (--- ... ---) is required' },
    };
  }

  const split = splitFrontmatter(source);
  if (!split) {
    return {
      ok: false,
      error: { code: 'missing', message: 'frontmatter block (--- ... ---) is required' },
    };
  }

  let raw: unknown;
  try {
    raw = parseYaml(split.yaml);
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'missing',
        message: e instanceof Error ? e.message : 'frontmatter parse error',
      },
    };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: { code: 'missing', message: 'frontmatter must be a YAML mapping' },
    };
  }

  const normalized = normalizeData(raw as Record<string, unknown>);
  const validated = postFrontmatterSchema.safeParse(normalized);
  if (!validated.success) {
    const issues = validated.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    return {
      ok: false,
      error: { code: 'schema', message: 'invalid frontmatter', issues },
    };
  }

  return {
    ok: true,
    value: { frontmatter: validated.data, body: split.body },
  };
}
