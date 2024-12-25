import tjsrEslintConfig from '@tjsr/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [...tjsrEslintConfig],
  files: ['**/*.ts'],
  ignores: ['dist/**', 'src/generated/**'],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
  }
});
