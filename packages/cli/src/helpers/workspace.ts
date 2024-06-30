import fs from 'node:fs';
import path from 'node:path';

const cache = new Map<string, string>();

export function findWorkspaceRoot(initialPath = process.cwd()) {
  let currentPath = initialPath;
  let lastPossiblePath = currentPath;
  let isRoot: 'false' | 'maybe' | 'true' = 'maybe';

  const isCurrentPathRoot = () => {
    const files = fs.readdirSync(currentPath);

    const lockFiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];
    const hasLockFile = files.some((file) => lockFiles.includes(file));
    if (hasLockFile) return 'true';

    const packageJson = files.find((file) => file === 'package.json');
    if (packageJson) {
      const packageContent = fs.readFileSync(
        path.resolve(currentPath, packageJson),
        'utf8',
      );
      const packageObject = //
        JSON.parse(packageContent) as { packageManager?: string };
      if (packageObject.packageManager) return 'true';
      return 'maybe';
    }

    return 'false';
  };

  const shouldContinue = true;
  while (shouldContinue) {
    if (cache.has(currentPath)) return cache.get(currentPath)!;

    isRoot = isCurrentPathRoot();
    const nextPath = path.resolve(currentPath, '..');

    if (isRoot === 'true' || nextPath === currentPath) break;
    else if (isRoot === 'maybe') lastPossiblePath = currentPath;

    currentPath = nextPath;
  }

  const finalPath = isRoot === 'true' ? currentPath : lastPossiblePath;
  cache.set(initialPath, finalPath);
  return finalPath;
}

export function getCurrentNextVersion() {
  const packagePath = path.join(
    findWorkspaceRoot(),
    'node_modules/next/package.json',
  );
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent) as { version: string };
  return packageJson.version.split('-')[0]!;
}
