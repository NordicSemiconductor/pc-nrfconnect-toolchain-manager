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

import { combineReducers } from 'redux';
import appReducer from '../reducers';
import { getLatestToolchain, environmentsByVersion, addEnvironment } from './managerReducer';

const older = {
    version: '20200217',
    name: 'ncs-toolchain-v1.2.0-20200217-a56f2eb.zip',
};
const younger = {
    version: '20200218',
    name: 'ncs-toolchain-v1.2.0-20200218-0ef73a3.zip',
};

describe('getLatestToolchain', () => {
    it('gets the latest of several toolchains', () => {
        expect(getLatestToolchain([younger, older])).toBe(younger);
        expect(getLatestToolchain([older, younger])).toBe(younger);
    });

    it('does not alter the supplied list of toolchains', () => {
        const toolchains = [older, younger];
        getLatestToolchain(toolchains);

        expect(toolchains).toStrictEqual([older, younger]);
    });
});


const reducer = combineReducers({ app: appReducer });
describe('managerReducer', () => {
    it('can add an environment', () => {
        const anEnvironment = { version: 'v1.2.0' };

        const withAnEnvironment = reducer(undefined, addEnvironment(anEnvironment));

        expect(environmentsByVersion(withAnEnvironment)).toStrictEqual([anEnvironment]);
    });

    it('can update an environment', () => {
        const anEnvironment = { version: 'v1.2.0' };
        const anUpdatedEnvironment = { version: 'v1.2.0', aProp: 'a value' };

        const withAnUpdatedEnvironment = [
            addEnvironment(anEnvironment),
            addEnvironment(anUpdatedEnvironment),
        ].reduce(reducer, undefined);

        expect(environmentsByVersion(withAnUpdatedEnvironment))
            .toStrictEqual([anUpdatedEnvironment]);
    });
});
