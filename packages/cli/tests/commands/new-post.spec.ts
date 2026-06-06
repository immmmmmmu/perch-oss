import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runNewPost } from '../../src/commands/new-post.js';

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'perch-newpost-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('runNewPost', () => {
  it('creates posts/{date}-{slug}.md with frontmatter', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await runNewPost({ projectDir: workDir, slug: 'hello-world' });
    const filePath = join(workDir, 'posts', `${today}-hello-world.md`);
    expect(result.path).toBe(filePath);
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, 'utf8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('title: hello-world');
    expect(content).toContain(`publishedAt: ${today}`);
  });

  it('appends locale suffix when --locale en is provided', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await runNewPost({ projectDir: workDir, slug: 'hello', locale: 'en' });
    expect(result.path.endsWith(`${today}-hello.en.md`)).toBe(true);
  });

  it('rejects an invalid slug', async () => {
    await expect(runNewPost({ projectDir: workDir, slug: 'Hello World!' })).rejects.toThrow(/slug/);
  });

  it('refuses to overwrite an existing file', async () => {
    await runNewPost({ projectDir: workDir, slug: 'hello' });
    await expect(runNewPost({ projectDir: workDir, slug: 'hello' })).rejects.toThrow(/exists/);
  });
});
