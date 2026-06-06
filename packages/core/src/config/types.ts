import { z } from 'zod';

const profileLinkSchema = z.object({
  label: z.string(),
  href: z.string().url(),
  description: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  markdown: z.string().optional(),
  avatarUrl: z.string().optional(),
  links: z.array(profileLinkSchema).optional(),
});

const siteSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  ogImage: z.string().optional(),
  favicon: z.string().optional(),
  twitterHandle: z.string().optional(),
});

const feedSourceSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  locale: z.string().optional(),
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
  .transform((v) => postsSectionInnerSchema.parse(v ?? {}));

export const perchConfigSchema = z.object({
  profile: profileSchema,
  site: siteSchema.optional(),
  locale: z.enum(['ja', 'en']).default('ja'),
  theme: z.string().default('minimal'),
  feeds: z.array(feedSourceSchema).default([]),
  posts: postsSectionSchema,
});

export type PerchConfig = Readonly<z.infer<typeof perchConfigSchema>>;
export type ProfileConfig = Readonly<z.infer<typeof profileSchema>>;
export type PostsSectionConfig = Readonly<z.infer<typeof postsSectionSchema>>;
