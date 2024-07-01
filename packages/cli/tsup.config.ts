import { defineConfig } from '@configs/tsup';

export default defineConfig({
  entry: ['src/program.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: false,
});
