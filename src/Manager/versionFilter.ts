import semver from 'semver';

export const hasMoreRecent = (version: string, versions: string[]): boolean => {
    const anydistancetoogreat = versions.some(v =>
        distanceTooGreat(v, version)
    );
    return anydistancetoogreat;
};

const distanceTooGreat = (version: string, bigVersions: string): boolean => {
    switch (semver.diff(version, bigVersions)) {
        case 'patch':
            return semver.patch(version) - semver.patch(bigVersions) > 1;

        case 'minor':
            return semver.minor(version) - semver.minor(bigVersions) > 1;
        default:
            return false;
    }
};

export default hasMoreRecent;
