/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
