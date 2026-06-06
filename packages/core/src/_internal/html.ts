// Tiny HTML utility helpers used by the feed parser. Intentionally narrow:
// the parser only needs entity decoding + tag stripping for plain summaries,
// not full sanitisation (callers that render must run their own sanitiser).

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, raw: string) => {
    if (raw.startsWith('#x') || raw.startsWith('#X')) {
      const code = Number.parseInt(raw.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : `&${raw};`;
    }
    if (raw.startsWith('#')) {
      const code = Number.parseInt(raw.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : `&${raw};`;
    }
    return NAMED_ENTITIES[raw.toLowerCase()] ?? `&${raw};`;
  });
}

export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

export function plainText(input: string): string {
  return decodeEntities(stripTags(input)).replace(/\s+/g, ' ').trim();
}
