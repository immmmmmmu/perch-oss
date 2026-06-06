import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(HERE, '../templates/post.md.tmpl');

export interface RunNewPostOptions {
  readonly projectDir: string;
  readonly slug: string;
  readonly locale?: 'ja' | 'en';
}

export interface RunNewPostResult {
  readonly path: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function runNewPost(opts: RunNewPostOptions): Promise<RunNewPostResult> {
  if (!SLUG_PATTERN.test(opts.slug)) {
    throw new Error(
      `Invalid slug: "${opts.slug}". Use lowercase letters, digits, and hyphens (must start with letter/digit).`,
    );
  }

  const date = today();
  const localeSuffix = opts.locale && opts.locale !== 'ja' ? `.${opts.locale}` : '';
  const filename = `${date}-${opts.slug}${localeSuffix}.md`;
  const postsDir = join(opts.projectDir, 'posts');
  const filePath = join(postsDir, filename);

  if (existsSync(filePath)) {
    throw new Error(`Post already exists: ${filePath}`);
  }

  await mkdir(postsDir, { recursive: true });

  const template = await readFile(TEMPLATE_PATH, 'utf8');
  const content = template.replaceAll('{{slug}}', opts.slug).replaceAll('{{date}}', date);

  await writeFile(filePath, content, 'utf8');
  return { path: filePath };
}
