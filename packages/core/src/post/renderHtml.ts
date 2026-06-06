import rehypeParse from 'rehype-parse';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

import { sanitizeSchema } from './_sanitizeSchema.js';

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify);

export async function renderHtml(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}
