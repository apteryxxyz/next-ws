import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/program.ts'],
  format: ['cjs'],
  target: 'es2022',
  clean: true,
  splitting: true,
  bundle: true,
  treeshake: true,
  keepNames: true,
  minifySyntax: true,
});
