import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  runNew,
  buildConfigYaml,
  buildPostsHelloMd,
  promptProjectParams,
} from '../src/commands/new.js';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  group: vi
    .fn()
    .mockImplementation(async (tasks: Record<string, () => Promise<unknown>>, _opts?: unknown) => {
      const results: Record<string, unknown> = {};
      for (const [key, fn] of Object.entries(tasks)) {
        results[key] = await fn();
      }
      return results;
    }),
  text: vi.fn().mockResolvedValue('Interactive User'),
  select: vi.fn().mockResolvedValueOnce('en').mockResolvedValue('editorial'),
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'perch-new-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

describe('buildConfigYaml', () => {
  it('generates valid YAML string with all fields', () => {
    const yaml = buildConfigYaml({ name: 'Alice', bio: 'Dev', locale: 'en', theme: 'grid' });
    expect(yaml).toContain('name: "Alice"');
    expect(yaml).toContain('locale: en');
    expect(yaml).toContain('theme: grid');
    expect(yaml).toContain('feeds:');
  });

  it('includes posts section with enabled: true', () => {
    const yaml = buildConfigYaml({ name: 'Alice', bio: 'Dev', locale: 'en', theme: 'grid' });
    expect(yaml).toContain('posts:');
    expect(yaml).toContain('enabled: true');
    expect(yaml).toContain('dir: ./posts');
    expect(yaml).toContain('assetsDir: ./assets');
  });
});

describe('promptProjectParams', () => {
  it('calls clack group and returns typed params', async () => {
    const { group } = await import('@clack/prompts');
    const result = await promptProjectParams({
      name: 'Default',
      bio: 'Bio',
      locale: 'ja',
      theme: 'minimal',
    });
    expect(group).toHaveBeenCalledOnce();
    expect(typeof result.name).toBe('string');
    expect(typeof result.locale).toBe('string');
    expect(typeof result.theme).toBe('string');
  });
});

describe('runNew', () => {
  it('creates project directory', async () => {
    const target = join(tmpDir, 'my-profile');
    await runNew({ projectDir: target, defaults: true });
    expect(existsSync(target)).toBe(true);
  });

  it('creates perch.config.yaml', async () => {
    const target = join(tmpDir, 'my-profile');
    await runNew({ projectDir: target, defaults: true });
    expect(existsSync(join(target, 'perch.config.yaml'))).toBe(true);
  });

  it('generated config is valid YAML with required fields', async () => {
    const target = join(tmpDir, 'my-profile');
    await runNew({ projectDir: target, defaults: true });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('profile:');
    expect(yaml).toContain('locale:');
    expect(yaml).toContain('theme:');
    expect(yaml).toContain('feeds:');
  });

  it('creates profile.md and wires it from config', async () => {
    const target = join(tmpDir, 'markdown-profile');
    await runNew({ projectDir: target, defaults: true });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    const markdown = readFileSync(join(target, 'profile.md'), 'utf8');

    expect(yaml).toContain('markdown: "./profile.md"');
    expect(markdown).toContain('# My Name');
  });

  it('uses editorial as the default theme', async () => {
    const target = join(tmpDir, 'default-theme-profile');
    await runNew({ projectDir: target, defaults: true });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('theme: editorial');
  });

  it('explains that perch.config.yaml and public assets are the user edit points', async () => {
    const target = join(tmpDir, 'editable-profile');
    await runNew({ projectDir: target, defaults: true });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('EDIT THIS FILE');
    expect(yaml).toContain('public/avatar.png');
    expect(yaml).toContain('feeds:');
    expect(yaml).toContain('Replace this with your RSS');
    expect(yaml).toContain('https://www.youtube.com/@yourchannel');
  });

  it('creates AGENTS.md with AI editing instructions', async () => {
    const target = join(tmpDir, 'agent-profile');
    await runNew({ projectDir: target, defaults: true });
    const agents = readFileSync(join(target, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('perch profile project');
    expect(agents).toContain('Start with `perch.config.yaml`');
    expect(agents).toContain('Do not edit `dist/`');
    expect(agents).toContain('Run `perch build`');
  });

  it('creates human onboarding docs for self-hosted usage', async () => {
    const target = join(tmpDir, 'human-docs-profile');
    await runNew({ projectDir: target, defaults: true });
    const readme = readFileSync(join(target, 'README.md'), 'utf8');
    const deployment = readFileSync(join(target, 'docs', 'deployment.md'), 'utf8');
    expect(readme).toContain('Edit `perch.config.yaml`');
    expect(readme).toContain('Run `perch build`');
    expect(deployment).toContain('RSS updates are not reflected until a new build runs');
    expect(deployment).toContain('GitHub Actions');
    expect(deployment).toContain('cron');
  });

  it('creates a scheduled GitHub Actions workflow example', async () => {
    const target = join(tmpDir, 'workflow-profile');
    await runNew({ projectDir: target, defaults: true });
    const workflow = readFileSync(join(target, '.github', 'workflows', 'perch-build.yml'), 'utf8');
    expect(workflow).toContain('schedule:');
    expect(workflow).toContain('perch build');
    expect(workflow).toContain('dist/');
  });

  it('creates .gitignore', async () => {
    const target = join(tmpDir, 'my-profile');
    await runNew({ projectDir: target, defaults: true });
    expect(existsSync(join(target, '.gitignore'))).toBe(true);
  });

  it('accepts custom name from options', async () => {
    const target = join(tmpDir, 'named-profile');
    await runNew({ projectDir: target, defaults: true, name: 'Custom Name' });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('Custom Name');
  });

  it('does not overwrite existing project without force', async () => {
    const target = join(tmpDir, 'existing-profile');
    await runNew({ projectDir: target, defaults: true });
    await expect(runNew({ projectDir: target, defaults: true })).rejects.toThrow();
  });

  it('uses interactive prompts when defaults=false', async () => {
    const { group } = await import('@clack/prompts');
    const target = join(tmpDir, 'interactive-profile');
    await runNew({ projectDir: target, defaults: false });
    expect(group).toHaveBeenCalledOnce();
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('profile:');
  });

  it('respects locale option in defaults mode', async () => {
    const target = join(tmpDir, 'locale-profile');
    await runNew({ projectDir: target, defaults: true, locale: 'en' });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('locale: en');
  });

  it('respects theme option in defaults mode', async () => {
    const target = join(tmpDir, 'theme-profile');
    await runNew({ projectDir: target, defaults: true, theme: 'grid' });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('theme: grid');
  });

  it('creates posts directory', async () => {
    const target = join(tmpDir, 'posts-profile');
    await runNew({ projectDir: target, defaults: true });
    expect(existsSync(join(target, 'posts'))).toBe(true);
  });

  it('creates assets directory', async () => {
    const target = join(tmpDir, 'assets-profile');
    await runNew({ projectDir: target, defaults: true });
    expect(existsSync(join(target, 'assets'))).toBe(true);
  });

  it('creates sample post in posts directory', async () => {
    const target = join(tmpDir, 'sample-post-profile');
    await runNew({ projectDir: target, defaults: true });
    expect(existsSync(join(target, 'posts', '2026-05-12-hello.md'))).toBe(true);
  });

  it('generated config includes posts section with enabled: true', async () => {
    const target = join(tmpDir, 'posts-config-profile');
    await runNew({ projectDir: target, defaults: true });
    const yaml = readFileSync(join(target, 'perch.config.yaml'), 'utf8');
    expect(yaml).toContain('posts:');
    expect(yaml).toContain('enabled: true');
    expect(yaml).toContain('dir: ./posts');
    expect(yaml).toContain('assetsDir: ./assets');
  });

  it('sample post contains proper frontmatter and content', async () => {
    const target = join(tmpDir, 'post-content-profile');
    await runNew({ projectDir: target, defaults: true });
    const postContent = readFileSync(join(target, 'posts', '2026-05-12-hello.md'), 'utf8');
    expect(postContent).toContain('---');
    expect(postContent).toContain('title: perch へようこそ');
    expect(postContent).toContain('publishedAt: 2026-05-12');
    expect(postContent).toContain('tags: [welcome]');
    expect(postContent).toContain('# はじめての記事');
  });
});

describe('buildPostsHelloMd', () => {
  it('generates sample post with frontmatter', () => {
    const post = buildPostsHelloMd();
    expect(post).toContain('---');
    expect(post).toContain('title: perch へようこそ');
    expect(post).toContain('publishedAt: 2026-05-12');
  });
});
