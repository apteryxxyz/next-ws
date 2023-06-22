import * as fs from 'node:fs';
import * as path from 'node:path';

export function findWorkspaceRoot(initalPath = process.cwd()) {
    let currentPath = initalPath;
    let lastPossiblePath = currentPath;
    let isRoot: 'false' | 'maybe' | 'true' = 'maybe';

    const isCurrentPathRoot = () => {
        const files = fs.readdirSync(currentPath);

        const lockFiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];
        const hasLockFile = files.some(file => lockFiles.includes(file));
        if (hasLockFile) return 'true';

        const packageJson = files.find(file => file === 'package.json');
        if (packageJson) {
            const packageContent = fs.readFileSync(
                path.resolve(currentPath, packageJson),
                'utf8'
            );
            const packageObject = JSON.parse(packageContent);
            if (packageObject.packageManager) return 'true';
            return 'maybe';
        }

        return 'false';
    };

    while (true) {
        isRoot = isCurrentPathRoot();
        const nextPath = path.resolve(currentPath, '..');

        if (isRoot === 'true' || nextPath === currentPath) break;
        else if (isRoot === 'maybe') lastPossiblePath = currentPath;

        currentPath = nextPath;
    }

    return isRoot === 'true' ? currentPath : lastPossiblePath;
}
