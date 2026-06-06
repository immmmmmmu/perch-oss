import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Only the wrapper. Paraglide-generated runtime / messages live under
      // `src/paraglide/` and are excluded from coverage; they are exercised
      // indirectly by `tests/runtime.spec.ts` to confirm the public surface
      // resolves correctly.
      include: ['src/index.ts'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
});
