import { defaultSchema } from 'rehype-sanitize';

import type { Options as SanitizeSchema } from 'rehype-sanitize';

export const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'a'],
  attributes: {
    ...defaultSchema.attributes,
    a: [['href', /^https?:\/\//]],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./]],
  },
};
