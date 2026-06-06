import { describe, expect, it } from 'vitest';

import { renderHtml } from '../../src/post/renderHtml.js';

describe('renderHtml', () => {
  it('passes through safe HTML', async () => {
    const out = await renderHtml('<p>hello <strong>world</strong></p>');
    expect(out).toContain('<p>hello <strong>world</strong></p>');
  });

  it('strips <script> tags entirely', async () => {
    const out = await renderHtml('ok<script>evil()</script>');
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain('ok');
  });

  it('strips on* attributes', async () => {
    const out = await renderHtml('<button onclick="x">click</button>');
    expect(out).not.toMatch(/onclick/i);
  });

  it('removes javascript: hrefs', async () => {
    const out = await renderHtml('<a href="javascript:1">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });
});
