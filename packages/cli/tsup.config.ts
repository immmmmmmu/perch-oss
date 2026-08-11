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
    '@perch-app/core',
    '@perch-app/theme-card',
    '@perch-app/theme-editorial',
    '@perch-app/theme-grid',
    '@perch-app/theme-minimal',
    '@perch-app/theme-timeline',
    '@perch-app/themes-shared',
  ],
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire as _cr } from "module"; const require = _cr(import.meta.url);',
  },
});
