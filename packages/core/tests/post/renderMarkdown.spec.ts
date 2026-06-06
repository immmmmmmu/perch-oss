import { describe, expect, it } from 'vitest';

import { renderMarkdown } from '../../src/post/renderMarkdown.js';

describe('renderMarkdown', () => {
  it('renders headings and paragraphs', async () => {
    const html = await renderMarkdown('# Title\n\npara');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<p>para</p>');
  });

  it('supports GFM tables and strikethrough', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n~~old~~');
    expect(html).toContain('<table>');
    expect(html).toContain('<del>old</del>');
  });

  it('strips inline <script> tags', async () => {
    const html = await renderMarkdown('hello <script>alert(1)</script> world');
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain('hello');
  });

  it('strips javascript: links', async () => {
    const html = await renderMarkdown('[click](javascript:alert(1))');
    expect(html).not.toMatch(/href="javascript:/i);
  });

  it('strips on* event attributes from markdown-generated HTML', async () => {
    const html = await renderMarkdown('[link](https://example.com)');
    expect(html).not.toMatch(/onclick/i);
    expect(html).toContain('href="https://example.com"');
  });

  it('escapes plain text with HTML special characters', async () => {
    const html = await renderMarkdown('a < b & c');
    expect(html).toMatch(/a &#x?[0-9a-fA-F]+;|a &lt;/);
  });
});
