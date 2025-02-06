import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/{client,server}/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
  },
  {
    entry: ['src/cli.ts'],
    format: 'cjs',
    external: ['next-ws'],
    noExternal: ['*'],
  },
]);
