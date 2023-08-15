import * as fs from 'node:fs';
import * as path from 'node:path';

const cache = new Map<string, string>();

export function findWorkspaceRoot(initalPath = process.cwd()) {
  let currentPath = initalPath;
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
        'utf8'
      );
      const packageObject = JSON.parse(packageContent) as {
        packageManager?: string;
      };
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
  cache.set(initalPath, finalPath);
  return finalPath;
}
