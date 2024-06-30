export function defineConfig(options) {
  if (!options.entry) throw new Error("Must have 'entry'");
  return Object.assign(
    {
      skipNodeModulesBundle: true,
      outExtension: ({ format: f }) => ({ js: f === 'esm' ? '.mjs' : '.cjs' }),
      //
      platform: 'node',
      format: ['esm', 'cjs'],
      target: 'es2022',
      //
      clean: true,
      splitting: true,
      bundle: true,
      treeshake: true,
      keepNames: true,
      minifySyntax: true,
      //
      dts: true,
      sourcemap: true,
    },
    options,
  );
}
