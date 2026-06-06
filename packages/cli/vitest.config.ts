import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli.ts',
        'src/commands/dev.ts',
        'src/runtime/index.ts',
        'src/storage/index.ts',
        'src/index.ts',
      ],
    },
  },
  resolve: {
    conditions: ['import', 'default'],
  },
});
