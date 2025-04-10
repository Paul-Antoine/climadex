/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/backend/asset/functions/api',

  plugins: [nxViteTsPaths()],

  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reporter: 'lcovonly',
      reportsDirectory: '../coverage/backend/',
      provider: 'v8',
    },
    passWithNoTests: true,
  },
});
