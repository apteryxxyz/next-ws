import type { Options } from 'tsup';

export declare function defineConfig(options: Options): {
  skipNodeModulesBundle: true;
  outExtension: ({
    format: f,
  }: {
    options: import('tsup').NormalizedOptions;
    format: import('tsup').Format;
    pkgType?: string | undefined;
  }) => {
    js: string;
  };
  platform: 'node';
  format: ('cjs' | 'esm')[];
  target: 'es2022';
  clean: true;
  splitting: true;
  bundle: true;
  treeshake: true;
  keepNames: true;
  minifySyntax: true;
  dts: true;
} & Options;
