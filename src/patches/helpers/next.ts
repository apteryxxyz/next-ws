import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Resolve the path to the next-ws installation directory.
 * @returns The installation directory for this package
 */
export function resolveNextWsDirectory() {
  const id = //
    require.resolve('next-ws/package.json', { paths: [process.cwd()] });
  return dirname(id);
}

/**
 * Resolve the path to the Next.js installation directory.
 * @returns The Next.js installation directory
 */
export function resolveNextDirectory() {
  const id = //
    require.resolve('next/package.json', { paths: [process.cwd()] });
  return dirname(id);
}

/**
 * Get the version of Next.js from the installation directory's `package.json`.
 * @returns The version of Next.js
 */
export async function getInstalledNextVersion() {
  const id = join(resolveNextDirectory(), 'package.json');
  const pkg = await readFile(id, 'utf8').then(JSON.parse);
  return String(pkg.version.split('-')[0]);
}

export interface Trace {
  patch: string;
  version: string;
}

/**
 * Get the next-ws trace of the current installation of Next.js.
 * @returns Trace object
 */
export async function readTrace() {
  const id = join(resolveNextDirectory(), '.next-ws-trace.json');
  return readFile(id, 'utf-8')
    .then<Trace>(JSON.parse)
    .catch(() => null);
}

/**
 * Set the next-ws trace of the current installation of Next.js.
 * @param trace Trace object
 */
export async function writeTrace(trace: Trace) {
  const id = join(resolveNextDirectory(), '.next-ws-trace.json');
  await writeFile(id, JSON.stringify(trace, null, 2));
}
