import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.resolve(here, '..', 'scripts', 'check-coverage.mjs');

describe('i18n coverage', () => {
  it('reports zero missing / extra keys across configured locales', () => {
    const result = spawnSync('node', [scriptPath], {
      cwd: path.resolve(here, '..'),
      encoding: 'utf8',
    });
    expect(result.status, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('aligned with base');
  });
});
