import { findEnvFile, findPackageJson } from '@tjsr/testutils';

import { defineConfig } from 'vitest/config';
import path from 'path';

const packageJsonLocation = path.dirname(findPackageJson(__dirname));
const setupFilesPath = path.resolve(packageJsonLocation, 'src/setup-tests.ts');
const testEnvFile = findEnvFile('.env.test', __dirname);

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      DEBUG: "absee express-session",
      DOTENV_FLOW_PATH: path.dirname(testEnvFile) || '.env.test',
      DOTENV_FLOW_PATTERN: '.env.test',
    },
    globals: true,
    include: ['**/__tests__/*.{js,tsx,ts}', '**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
    setupFiles: [setupFilesPath],
    testTimeout: (process.env['VITEST_VSCODE'] !== undefined ? 120 : 3) * 1000,
  },
});
