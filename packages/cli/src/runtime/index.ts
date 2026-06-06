declare const Bun: unknown;

export const runtime = {
  name: typeof Bun !== 'undefined' ? 'bun' : 'node',
  fetch: globalThis.fetch.bind(globalThis),
} as const;
