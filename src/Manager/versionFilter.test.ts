/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { filterEnvironments } from './versionFilter';

const filter = (versions: string[]) =>
    filterEnvironments(versions.map(version => ({ version })));

describe('patch versions filtered when there is a gap of 2', () => {
    it('keep patch versions close enough to newest version', () => {
        const versions = ['1.2.2', '1.2.3'];
        const filtered = filter(versions);
        expect(filtered.length).toBe(2);
    });

    it('discard patch versions too far away from newest version', () => {
        const versions = ['1.2.7', '1.2.3'];
        const filtered = filter(versions);
        expect(filtered.length).toBe(2);
    });

    it('ignore minor versions above checked version', () => {
        const versions = ['1.3.7', '1.2.3'];
        const filtered = filter(versions);
        expect(filtered.length).toBe(2);
    });

    it('filter old versions and old pre-releases', () => {
        const sampleInput =
            '1.4.0, 1.4.1, 1.4.2, 1.5.0, 1.6.0, 1.6.1, 2.0.1-rc1, 2.0.1, 2.0.0, 2.1.0';
        const sampleExpected = '1.6.0, 1.6.1, 2.0.1, 2.0.0, 2.1.0';
        const versions = sampleInput.split(', ');
        const filtered = filter(versions);
        expect(filtered.map(v => v.version).join(', ')).toEqual(sampleExpected);
    });

    it('filter old versions and keep new pre-releases', () => {
        const sampleInput =
            '1.4.0, 1.4.1, 1.4.2, 1.5.0, 1.6.0, 1.6.1, 2.0.1-rc1, 2.0.1, 2.0.0, 2.0.99-dev1, 2.1.0';
        const sampleExpected = '1.6.0, 1.6.1, 2.0.1, 2.0.0, 2.0.99-dev1, 2.1.0';
        const versions = sampleInput.split(', ');
        const filtered = filter(versions);
        expect(filtered.map(v => v.version).join(', ')).toEqual(sampleExpected);
    });
});
