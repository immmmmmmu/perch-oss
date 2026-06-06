import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runBuild } from '../../src/commands/build.js';
import { loadConfig } from '../../src/config-loader.js';

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'perch-build-'));
  mkdirSync(join(workDir, 'posts'), { recursive: true });
  writeFileSync(
    join(workDir, 'perch.config.yaml'),
    `profile:\n  name: Test\nlocale: ja\ntheme: editorial\nfeeds: []\nposts:\n  enabled: true\n`,
    'utf8',
  );
  writeFileSync(join(workDir, 'profile.md'), 'profile body', 'utf8');
  writeFileSync(
    join(workDir, 'posts', '2026-05-12-hello.md'),
    `---\ntitle: Hello\npublishedAt: 2026-05-12\n---\n\n# Hi\n`,
    'utf8',
  );
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('runBuild — posts integration', () => {
  it('emits posts/{slug}/index.html, posts/index.html and feed.xml', async () => {
    const configPath = join(workDir, 'perch.config.yaml');
    const config = await loadConfig(configPath);
    const outDir = join(workDir, 'dist');
    await runBuild({
      config,
      configPath,
      outDir,
      cacheDir: join(workDir, '.perch', 'cache'),
      publicDir: join(workDir, 'public'),
    });

    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'posts', 'hello', 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'posts', 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'feed.xml'))).toBe(true);

    const feedXml = readFileSync(join(outDir, 'feed.xml'), 'utf8');
    expect(feedXml).toContain('<rss version="2.0"');
    expect(feedXml).toContain('Hello');
  });

  it('skips posts pages when posts.enabled is false', async () => {
    writeFileSync(
      join(workDir, 'perch.config.yaml'),
      `profile:\n  name: Test\nlocale: ja\ntheme: editorial\nfeeds: []\nposts:\n  enabled: false\n`,
      'utf8',
    );
    const configPath = join(workDir, 'perch.config.yaml');
    const config = await loadConfig(configPath);
    const outDir = join(workDir, 'dist-disabled');
    await runBuild({
      config,
      configPath,
      outDir,
      cacheDir: join(workDir, '.perch', 'cache'),
    });

    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    expect(existsSync(join(outDir, 'posts', 'index.html'))).toBe(false);
    expect(existsSync(join(outDir, 'feed.xml'))).toBe(false);
  });

  it('skips _-prefixed draft files', async () => {
    writeFileSync(
      join(workDir, 'posts', '_draft.md'),
      `---\ntitle: Draft\npublishedAt: 2026-05-12\n---\n\nDraft content\n`,
      'utf8',
    );
    const configPath = join(workDir, 'perch.config.yaml');
    const config = await loadConfig(configPath);
    const outDir = join(workDir, 'dist-drafts');
    await runBuild({
      config,
      configPath,
      outDir,
      cacheDir: join(workDir, '.perch', 'cache'),
    });

    expect(existsSync(join(outDir, 'posts', 'draft', 'index.html'))).toBe(false);
    // hello post still generated
    expect(existsSync(join(outDir, 'posts', 'hello', 'index.html'))).toBe(true);
  });

  it('copies assets directory when posts.enabled is true and assets exist', async () => {
    const assetsDir = join(workDir, 'assets');
    mkdirSync(assetsDir, { recursive: true });
    writeFileSync(join(assetsDir, 'image.png'), 'fake-png-data', 'utf8');

    const configPath = join(workDir, 'perch.config.yaml');
    const config = await loadConfig(configPath);
    const outDir = join(workDir, 'dist-assets');
    await runBuild({
      config,
      configPath,
      outDir,
      cacheDir: join(workDir, '.perch', 'cache'),
    });

    expect(existsSync(join(outDir, 'assets', 'image.png'))).toBe(true);
  });
});
