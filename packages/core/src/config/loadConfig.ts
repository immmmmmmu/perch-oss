import { load as parseYaml, YAMLException } from 'js-yaml';

import { perchConfigSchema } from './types.js';

import type { PerchConfig } from './types.js';

export type LoadConfigError =
  | { readonly code: 'yaml'; readonly message: string }
  | { readonly code: 'schema'; readonly message: string; readonly issues: readonly string[] };

export type LoadConfigResult =
  | { readonly ok: true; readonly value: PerchConfig }
  | { readonly ok: false; readonly error: LoadConfigError };

export function loadConfig(yamlText: string): LoadConfigResult {
  let raw: unknown;
  try {
    raw = parseYaml(yamlText);
  } catch (e) {
    const message = e instanceof YAMLException ? e.message : 'YAML parse error';
    return { ok: false, error: { code: 'yaml', message } };
  }

  const parsed = perchConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    return {
      ok: false,
      error: { code: 'schema', message: 'invalid perch.config.yaml', issues },
    };
  }
  return { ok: true, value: parsed.data };
}
