import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { load as parseYaml } from 'js-yaml';
import { Renderer, marked, type Tokens } from 'marked';
import { z } from 'zod';

const feedSourceSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  locale: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  markdown: z.string().optional(),
  avatarUrl: z.string().optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().url(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

const siteSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  ogImage: z.string().optional(),
  favicon: z.string().optional(),
  twitterHandle: z.string().optional(),
});

const postsSectionInnerSchema = z.object({
  enabled: z.boolean().default(false),
  dir: z.string().default('./posts'),
  assetsDir: z.string().default('./assets'),
  perPage: z.number().int().positive().max(100).default(10),
  showInTimeline: z.boolean().default(true),
});

// Zod v4 does not recursively apply field-level defaults when the whole object
// value is `undefined` (the outer `.default({})` trick returns `{}` without
// filling nested defaults). Using `.optional().transform(...)` forces a
// second parse through `postsSectionInnerSchema` so field defaults are always
// applied, regardless of whether the `posts` key is present in the YAML.
const postsSectionSchema = postsSectionInnerSchema
  .optional()
  .transform((v) => postsSectionInnerSchema.parse(v ?? {})) as z.ZodType<
  z.infer<typeof postsSectionInnerSchema>
>;

const perchConfigSchema = z.object({
  profile: profileSchema,
  site: siteSchema.optional(),
  locale: z.enum(['ja', 'en']).default('ja'),
  theme: z.string().default('minimal'),
  feeds: z.array(feedSourceSchema).default([]),
  posts: postsSectionSchema,
});

export type PostsSectionConfig = Readonly<z.infer<typeof postsSectionInnerSchema>>;

export type PerchConfig = z.infer<typeof perchConfigSchema> & {
  readonly profile: z.infer<typeof profileSchema> & { readonly bioHtml?: string };
};

async function loadYaml(configPath: string): Promise<unknown> {
  const raw = await readFile(configPath, 'utf8');
  return parseYaml(raw);
}

async function loadTs(configPath: string): Promise<unknown> {
  const fileUrl = pathToFileURL(configPath).href;
  const mod = (await import(fileUrl)) as { default?: unknown };
  return mod.default ?? mod;
}

function escapeMarkdownHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function isSafeMarkdownUrl(value: string): boolean {
  if (value.startsWith('#') || value.startsWith('/') || value.startsWith('./')) return true;
  if (value.startsWith('../')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function renderMarkdown(markdown: string): string {
  const renderer = new Renderer();
  renderer.link = function link({ href, title, tokens }: Tokens.Link): string {
    const label = this.parser.parseInline(tokens);
    if (!isSafeMarkdownUrl(href)) return label;
    const titleAttr = title ? ` title="${escapeMarkdownHtml(title)}"` : '';
    return `<a href="${escapeMarkdownHtml(href)}"${titleAttr}>${label}</a>`;
  };
  renderer.image = function image({ href, title, text }: Tokens.Image): string {
    if (!isSafeMarkdownUrl(href)) return '';
    const titleAttr = title ? ` title="${escapeMarkdownHtml(title)}"` : '';
    return `<img src="${escapeMarkdownHtml(href)}" alt="${escapeMarkdownHtml(text)}"${titleAttr}>`;
  };
  return marked.parse(escapeMarkdownHtml(markdown), { async: false, renderer });
}

export async function loadConfig(configPath: string): Promise<PerchConfig> {
  const isTs = configPath.endsWith('.ts') || configPath.endsWith('.mts');
  const raw = isTs ? await loadTs(configPath) : await loadYaml(configPath);
  const config = perchConfigSchema.parse(raw);
  if (!config.profile.markdown) return config;

  const markdownPath = resolve(dirname(configPath), config.profile.markdown);
  const markdown = await readFile(markdownPath, 'utf8');
  return {
    ...config,
    profile: {
      ...config.profile,
      bioHtml: renderMarkdown(markdown),
    },
  };
}
