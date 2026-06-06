import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: { resolve: true, compilerOptions: { rootDir: 'src' } },
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2022',
  // Internal helpers must NOT be reachable as separate entrypoints.
  external: [],
});
