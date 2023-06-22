import { type Options, Range, SemVer, gt } from 'semver';

export * from 'semver';
export const maxVersion = (
    range_: Range | string,
    loose?: Options | boolean
) => {
    const range = new Range(range_, loose);
    let maximumVersion: SemVer | null = null;

    for (const comparators of range.set) {
        for (const {
            operator,
            semver: { version: version_ },
        } of comparators) {
            if (operator === '>' || operator === '>=') continue;

            const version = new SemVer(version_);

            if (operator === '<') {
                version.patch--;
                version.raw = version.format();
            }

            if (!maximumVersion || gt(maximumVersion, version))
                maximumVersion = version;
        }
    }

    return maximumVersion ?? new SemVer('x.x.x');
};
