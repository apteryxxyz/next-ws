import * as fs from 'node:fs';
import * as path from 'node:path';
import { findWorkspaceRoot } from './workspace';

/**
 * Get the Next WS patch version and Next.js version.
 * @returns The patch version and Next.js version if the patch has been applied, otherwise null.
 */
export function getPatch() {
  const location = path.join(
    findWorkspaceRoot(),
    'node_modules/next/.next-ws-trace.json'
  );

  try {
    const content = fs.readFileSync(location, 'utf8');
    return JSON.parse(content) as { patch: string; version: string };
  } catch {
    return null;
  }
}

/**
 * Verify that the Next WS patch has been applied to Next.js.
 * @returns The patch version and Next.js version if the patch has been applied, otherwise null.
 */
export function verifyPatch() {
  const patch = getPatch();
  if (!patch)
    throw new Error(
      'Next.js has not been patched to support Next WS, please run `npx next-ws-cli@latest patch`'
    );

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require('next/package.json') as { version: string };
  const version = packageJson.version.split('-')[0];
  if (patch.version !== version)
    throw new Error(
      `Next.js version mismatch, expected ${patch.version} but found ${version}, try running \`npx next-ws-cli@latest patch\``
    );
}
