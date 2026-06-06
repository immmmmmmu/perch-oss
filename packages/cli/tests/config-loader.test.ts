import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { loadConfig } from '../src/config-loader.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'perch-config-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('parses a valid YAML config', async () => {
    const configPath = join(tmpDir, 'perch.config.yaml');
    writeFileSync(
      configPath,
      `
profile:
  name: "Test User"
  bio: "A test bio"
locale: ja
theme: minimal
feeds:
  - url: "https://example.com/feed.xml"
    name: "Example Blog"
`,
    );
    const config = await loadConfig(configPath);
    expect(config.profile.name).toBe('Test User');
    expect(config.locale).toBe('ja');
    expect(config.theme).toBe('minimal');
    expect(config.feeds).toHaveLength(1);
    expect(config.feeds[0]!.url).toBe('https://example.com/feed.xml');
  });

  it('throws on missing required fields', async () => {
    const configPath = join(tmpDir, 'perch.config.yaml');
    writeFileSync(configPath, 'locale: ja\n');
    await expect(loadConfig(configPath)).rejects.toThrow();
  });

  it('throws on non-existent file', async () => {
    await expect(loadConfig(join(tmpDir, 'missing.yaml'))).rejects.toThrow();
  });

  it('defaults theme to minimal when omitted', async () => {
    const configPath = join(tmpDir, 'perch.config.yaml');
    writeFileSync(
      configPath,
      `
profile:
  name: "Test User"
locale: ja
feeds: []
`,
    );
    const config = await loadConfig(configPath);
    expect(config.theme).toBe('minimal');
  });

  it('loads profile markdown relative to the config file', async () => {
    const configPath = join(tmpDir, 'perch.config.yaml');
    writeFileSync(
      join(tmpDir, 'profile.md'),
      `
I write about **independent publishing**.

- note
- Zenn
`,
    );
    writeFileSync(
      configPath,
      `
profile:
  name: "Markdown User"
  markdown: "./profile.md"
locale: ja
feeds: []
`,
    );

    const config = await loadConfig(configPath);

    expect(config.profile.bioHtml).toContain('<strong>independent publishing</strong>');
    expect(config.profile.bioHtml).toContain('<li>note</li>');
  });

  it('escapes raw HTML and blocks unsafe markdown links in profile markdown', async () => {
    const configPath = join(tmpDir, 'perch.config.yaml');
    writeFileSync(
      join(tmpDir, 'profile.md'),
      `
<script>alert("xss")</script>

[bad](javascript:alert(1))
`,
    );
    writeFileSync(
      configPath,
      `
profile:
  name: "Safe User"
  markdown: "./profile.md"
locale: ja
feeds: []
`,
    );

    const config = await loadConfig(configPath);

    expect(config.profile.bioHtml).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(config.profile.bioHtml).not.toContain('javascript:');
  });

  it('does not accept raw bioHtml from config files', async () => {
    const configPath = join(tmpDir, 'perch.config.yaml');
    writeFileSync(
      configPath,
      `
profile:
  name: "Raw HTML User"
  bioHtml: "<img src=x onerror=alert(1)>"
locale: ja
feeds: []
`,
    );

    const config = await loadConfig(configPath);

    expect(config.profile.bioHtml).toBeUndefined();
  });

  it('loads TypeScript config file via fixture', async () => {
    const fixtureConfig = join(
      new URL('../tests/fixtures/sample.config.ts', import.meta.url).pathname,
    );
    const config = await loadConfig(fixtureConfig);
    expect(config.profile.name).toBe('Fixture User');
    expect(config.locale).toBe('ja');
  });
});
