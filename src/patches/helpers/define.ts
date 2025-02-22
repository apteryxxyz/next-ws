import { readFile, writeFile } from 'node:fs/promises';
import { join as joinPath } from 'node:path';
import logger from '~/commands/helpers/logger';
import { findNextDirectory } from '~/patches/helpers/next';

/**
 * Patches allow prepending short-hands to paths, this will resolve them.
 * @param path The path to resolve
 * @returns The resolved path
 */
async function resolvePath(path: string) {
  switch (path.split(':')[0]) {
    case 'next': {
      const nextDirectory = await findNextDirectory();
      const realPath = path.slice(5);
      return joinPath(nextDirectory, realPath);
    }
    default: {
      return path;
    }
  }
}

/**
 * Create a step for a patch.
 * @param options The options for the step
 * @returns The step
 */
export function createPatchStep(options: {
  title: string;
  path: `next:${string}`;
  ignoreIf?: string;
  modify(source: string): string | Promise<string>;
}) {
  return {
    title: options.title,
    modify: options.modify,
    async execute() {
      const path = await resolvePath(options.path);
      const source = await readFile(path, 'utf-8');
      if (options.ignoreIf && source.includes(options.ignoreIf)) return false;
      const newSource = await options.modify(source);
      await writeFile(path, newSource);
      return true;
    },
  };
}

/**
 * Create a patch.
 * @param options The options for the patch
 * @returns The patch
 */
export function createPatch(options: {
  name: string;
  // Due to the auto update github action, the typing of this needs to be strict
  versions: `>=${string}.${string}.${string} <=${string}.${string}.${string}`;
  steps: ReturnType<typeof createPatchStep>[];
}) {
  return {
    name: options.name,
    versions: options.versions,
    async execute() {
      for (const step of options.steps)
        await logger.task(step.title, step.execute());
    },
  };
}
