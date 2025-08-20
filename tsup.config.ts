import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/{client,server}/index.ts'],
    // Keep the extension as .cjs as to not break the require() calls in the patches
    outExtension: () => ({ js: '.cjs', dts: '.d.cts' }),
    format: 'cjs',
    dts: true,
  },
  {
    entry: ['src/cli.ts'],
    outExtension: () => ({ js: '.cjs' }),
    format: 'cjs',
    external: ['next-ws'],
    noExternal: ['*'],
  },
]);
