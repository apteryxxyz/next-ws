import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as console from '~/commands/helpers/console';
import { findNextDirectory } from './next';

export interface PatchDefinition {
  name: string;
  // Due to the auto update github action, the typing of this needs to be strict
  versions: `>=${string}.${string}.${string} <=${string}.${string}.${string}`;
  steps: PatchStep[];
}

export interface Patch extends PatchDefinition {
  execute(): Promise<boolean>;
}

/**
 * Define a patch.
 * @param definition The definition for the patch
 * @returns The patch
 */
export function definePatch(definition: PatchDefinition): Patch {
  return {
    ...definition,
    async execute() {
      const results: boolean[] = [];
      for (const step of this.steps)
        await console
          .task(step.execute(), step.title)
          .then((r) => results.push(r));
      return results.every((r) => r);
    },
  };
}

export interface PatchStepDefinition {
  title: string;
  path: `next:${string}`;
  ignore?: string;
  modify(source: string): string | Promise<string>;
}

export interface PatchStep extends PatchStepDefinition {
  execute(): Promise<boolean>;
}

/**
 * Define a step for a patch.
 * @param definition The definition for the step
 * @returns The step
 */
export function definePatchStep(definition: PatchStepDefinition): PatchStep {
  return {
    ...definition,
    async execute() {
      const path = await resolvePath(this.path);
      console.debug('Applying', `"${this.title}"`, 'to', `"${path}"`);
      const source = await readFile(path, 'utf-8');
      if (this.ignore && source.includes(this.ignore)) return false;
      const newSource = await this.modify(source);
      await writeFile(path, newSource);
      return true;
    },
  };
}

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
      return resolve(nextDirectory, realPath);
    }
    default: {
      return path;
    }
  }
}
