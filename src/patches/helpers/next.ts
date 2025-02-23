import { readFile, writeFile } from 'node:fs/promises';
import { join as joinPaths, dirname as resolveDirname } from 'node:path';

/**
 * Get the dist dirname of this package.
 * @returns The dist dirname of this package
 */
export function getDistDirname() {
  const resolveOptions = { paths: [process.cwd()] };
  const nextWsPackagePath = //
    require.resolve('next-ws/package.json', resolveOptions);
  const nextWsDirName = resolveDirname(nextWsPackagePath);
  return `${nextWsDirName.replaceAll('\\', '/')}/dist`;
}

/**
 * Find the Next.js installation directory.
 * @returns The Next.js installation directory
 */
export async function findNextDirectory() {
  const resolveOptions = { paths: [process.cwd()] };
  const nextPackagePath = require.resolve('next/package.json', resolveOptions);
  return resolveDirname(nextPackagePath);
}

/**
 * Get the version of Next.js from the installation directory's `package.json`.
 * @returns The version of Next.js
 */
export async function getNextVersion() {
  const nextDirectory = await findNextDirectory();
  const nextPackagePath = joinPaths(nextDirectory, 'package.json');
  const nextPackage = await readFile(nextPackagePath, 'utf-8').then(JSON.parse);
  return String(nextPackage.version.split('-')[0]);
}

/**
 * Get the next-ws trace of the current installation of Next.js.
 * @returns Trace object
 */
export async function getTrace() {
  const nextDirectory = await findNextDirectory();
  const tracePath = joinPaths(nextDirectory, '.next-ws-trace.json');
  return readFile(tracePath, 'utf-8')
    .then<Parameters<typeof setTrace>[0]>(JSON.parse)
    .catch(() => null);
}

/**
 * Set the next-ws trace of the current installation of Next.js.
 * @param trace Trace object
 */
export async function setTrace(trace: { patch: string; version: string }) {
  const nextDirectory = await findNextDirectory();
  const tracePath = joinPaths(nextDirectory, '.next-ws-trace.json');
  await writeFile(tracePath, JSON.stringify(trace, null, 2));
}
