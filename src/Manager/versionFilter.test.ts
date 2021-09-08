/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { filterEnvironments } from './versionFilter';

const mapToEnvironment = (version: string) => ({
    version,
    toolchains: [],
    toolchainDir: '',
    isInstalled: false,
});

const filter = (versions: string[]) =>
    filterEnvironments(versions.map(mapToEnvironment));

describe('filter versions to keep last 3 minor versions and installed environments', () => {
    it('Do not filter any of patches in last 3 minors', () => {
        const versions = ['1.2.2', '1.3.2', '1.3.3', '1.4.2'];
        const filtered = filter(versions);
        expect(filtered.length).toBe(4);
    });

    it('Do filter to only last 3 minors', () => {
        const versions = ['1.2.2', '1.3.2', '1.4.2', '1.5.2'];
        const filtered = filter(versions);
        expect(filtered.length).toBe(3);
    });

    it('do not filter installed versions', () => {
        const versions = ['1.2.2', '1.3.2', '1.4.2', '1.5.2'];
        const environments = versions.map(mapToEnvironment);
        // 1.2.2 is oldest and would get filtered if not installed
        environments[0].isInstalled = true;

        const filtered = filterEnvironments(environments);
        expect(filtered.length).toBe(4);
    });

    it('filter old versions and old pre-releases', () => {
        const sampleInput =
            '1.4.0, 1.4.1, 1.4.2, 1.5.0, 1.6.0, 1.6.1, 2.0.1-rc1, 2.0.1, 2.0.0, 2.1.0';
        const sampleExpected = '1.6.0, 1.6.1, 2.0.1, 2.0.0, 2.1.0';
        const versions = sampleInput.split(', ');
        const filtered = filter(versions);
        expect(filtered.map(v => v.version).join(', ')).toEqual(sampleExpected);
    });
});
