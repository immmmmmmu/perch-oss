// Verifies that every locale defined in `project.inlang/settings.json`
// translates the same set of message keys as the base locale.
//
// Exit code 1 with a per-locale diff listing if anything is missing or extra.
// Used by CI (`pnpm i18n:check` / TASK-0004 acceptance).
/* eslint-disable no-console -- CLI script intentionally prints status to stdout. */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(here, '..');
const projectDir = path.join(packageDir, 'project.inlang');

const settings = JSON.parse(await readFile(path.join(projectDir, 'settings.json'), 'utf8'));

const baseLocale = settings.baseLocale;
const locales = settings.locales;

if (!baseLocale || !Array.isArray(locales) || locales.length === 0) {
  console.error('settings.json is missing baseLocale or locales');
  process.exit(2);
}

async function load(locale) {
  const raw = JSON.parse(
    await readFile(path.join(packageDir, 'messages', `${locale}.json`), 'utf8'),
  );
  return Object.keys(raw).filter((k) => !k.startsWith('$'));
}

const baseKeys = new Set(await load(baseLocale));
let problems = 0;

for (const locale of locales) {
  if (locale === baseLocale) continue;
  const keys = new Set(await load(locale));
  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✔ ${locale}: complete (${keys.size} keys)`);
    continue;
  }

  problems += missing.length + extra.length;
  console.error(`✖ ${locale}:`);
  if (missing.length > 0) console.error(`  missing in ${locale}:`, missing);
  if (extra.length > 0) console.error(`  extra in ${locale}:`, extra);
}

if (problems > 0) {
  console.error(`\nTotal i18n problems: ${problems}`);
  process.exit(1);
}
console.log(`\nAll ${locales.length} locales are aligned with base "${baseLocale}".`);
