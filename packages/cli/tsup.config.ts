import { defineConfig } from '@configs/tsup';

export default defineConfig({
  entry: ['src/program.ts'],
  format: ['cjs'],
  dts: false,
  sourcemap: false,
});
