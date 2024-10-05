import { defineConfig } from 'vitest/config';
import { findPackageJson } from '@tjsr/testutils';
import path from 'path';

const packageJsonLocation = path.dirname(findPackageJson(__dirname));
const setupFilesPath = path.resolve(packageJsonLocation, 'src/setup-tests.ts');

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      DOTENV_FLOW_PATTERN: '.env.test',
    },
    globals: true,
    setupFiles: [setupFilesPath],
    testTimeout: (process.env['VITEST_VSCODE'] !== undefined ? 120 : 3) * 1000,
  },
});
