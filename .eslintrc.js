/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'prettier',
  ],
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/no-namespace': 'off',
  },
  ignorePatterns: [
    '**/.eslintrc.js',
    '**/*.config.js',
    '**/*.js',
    'packages/config/**',
    '.next',
    'dist/',
    '.yarn/*',
    'yarn.lock',
    '.yarnrc.yml',
  ],
  reportUnusedDisableDirectives: true,
};

module.exports = config;
