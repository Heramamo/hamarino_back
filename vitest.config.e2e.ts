import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      JWT_SECRET: 'e2e-test-secret',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/astap_e2e',
      NODE_ENV: 'test',
    },
  },
});
