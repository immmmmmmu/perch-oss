import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  target: 'node22',
  platform: 'node',
  bundle: true,
  splitting: false,
  clean: true,
  dts: false,
  noExternal: [
    '@perch/core',
    '@perch/theme-card',
    '@perch/theme-editorial',
    '@perch/theme-grid',
    '@perch/theme-minimal',
    '@perch/theme-timeline',
    '@perch/themes-shared',
  ],
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire as _cr } from "module"; const require = _cr(import.meta.url);',
  },
});
