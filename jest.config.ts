import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/test/mocks/styleMock.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePathIgnorePatterns: ['amplify', 'dist'],
  // preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  verbose: true,
};

export default config;
