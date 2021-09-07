import semver from 'semver';

export const filterEnvironments = <T extends { version: string }>(
    environments: T[]
): T[] => {
    const versions = sortedByVersion(environments).map(
        environment => environment.version
    );

    const minorsToInclude = [
        ...versions.reduce(
            (set, version) => set.add(hash(version)),
            new Set<string>()
        ),
    ].slice(0, 3);

    return environments.filter(
        environment =>
            filterPrerelease(environment.version, versions) &&
            minorsToInclude.some(minor => minor === hash(environment.version))
    );
};

const hash = (version: string) =>
    `${semver.major(version)}.${semver.minor(version)}`;

const filterPrerelease = (version: string, versions: string[]) => {
    const isPrerelease = (semver.prerelease(version)?.length ?? 0) > 0 ?? false;

    const hasRelease = versions.some(
        v => semver.diff(v, version) === 'prerelease'
    );

    return !isPrerelease || !hasRelease;
};

export const sortedByVersion = <T extends { version: string }>(
    list: T[]
): T[] => [...list].sort(byVersion);

const byVersion = (a: { version: string }, b: { version: string }) => {
    try {
        return -semver.compare(a.version, b.version);
    } catch (_) {
        switch (true) {
            case a.version < b.version:
                return -1;
            case a.version > b.version:
                return 1;
            default:
                return 0;
        }
    }
};
