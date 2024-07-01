import { readFileSync } from 'node:fs';
import path from 'node:path';

export function findNextDirectory() {
  return path.dirname(
    require.resolve('next/package.json', { paths: [process.cwd()] }),
  );
}

export function getNextVersion() {
  const packagePath = path.join(findNextDirectory(), 'package.json');
  const packageContent = readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent) as { version: string };
  return packageJson.version.split('-')[0]!;
}
