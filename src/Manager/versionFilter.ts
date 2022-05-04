/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import semver from 'semver';

import type { Environment } from '../state';

export const filterEnvironments = (
    environments: Environment[]
): Environment[] => {
    const versions = sortedByVersion(environments).map(
        environment => environment.version
    );

    const newestMinors = [
        ...versions.reduce(
            (set, version) => set.add(hash(version)),
            new Set<string>()
        ),
    ].slice(0, 3);

    const isInNewestMinors = (minors: string[], environment: Environment) =>
        minors.some(minor => minor === hash(environment.version));

    return environments.filter(
        environment =>
            (isReleasedOrPreRelease(environment.version, versions) &&
                isInNewestMinors(newestMinors, environment)) ||
            environment.isInstalled
    );
};

const hash = (version: string) =>
    semver.valid(version)
        ? `${semver.major(version)}.${semver.minor(version)}`
        : version;

const isReleasedOrPreRelease = (version: string, versions: string[]) => {
    if (semver.valid(version) === null) return true;
    const isPrerelease = (semver.prerelease(version)?.length ?? 0) > 0 ?? false;

    const hasRelease = versions.some(
        v => semver.valid(v) && semver.diff(v, version) === 'prerelease'
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
