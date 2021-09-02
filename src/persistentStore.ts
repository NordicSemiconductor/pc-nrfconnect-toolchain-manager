/* Copyright (c) 2015 - 2020, Nordic Semiconductor ASA
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

import os from 'os';
import path from 'path';
import { getPersistentStore as store } from 'pc-nrfconnect-shared';

export const isFirstInstall = () => store().get('isFirstInstall', true);
export const setHasInstalledAnNcs = () => store().set('isFirstInstall', false);

const defaultInstallDir =
    {
        win32: path.resolve(os.homedir(), 'ncs'),
        darwin: '/opt/nordic/ncs',
        linux: path.resolve(os.homedir(), 'ncs'),
        aix: undefined,
        android: undefined,
        cygwin: undefined,
        freebsd: undefined,
        netbsd: undefined,
        openbsd: undefined,
        sunos: undefined,
    }[process.platform] ?? path.resolve(os.homedir(), 'ncs');

export const persistedInstallDir = (): string =>
    process.platform === 'darwin'
        ? defaultInstallDir ?? ''
        : store<string>().get('installDir', defaultInstallDir ?? '');

export const setPersistedInstallDir = (dir: string) =>
    store().set('installDir', dir);

const indexJson =
    {
        win32: 'index.json',
        darwin: 'index-mac.json',
        linux: 'index-linux.json',
        aix: undefined,
        android: undefined,
        cygwin: undefined,
        freebsd: undefined,
        netbsd: undefined,
        openbsd: undefined,
        sunos: undefined,
    }[process.platform] ?? 'index-linux.json';

export const toolchainIndexUrl = () => {
    const value = store().get(
        'toolchainIndexUrl',
        'https://developer.nordicsemi.com/.pc-tools/toolchain'
    ) as string;
    return `${value.replace(/\/index.*.json$/, '')}/${indexJson}`;
};
export const toolchainUrl = (name: string) =>
    `${path.dirname(toolchainIndexUrl())}/${name}`;
export const setToolchainIndexUrl = (value: string) =>
    store().set('toolchainIndexUrl', value);

export const persistedShowMaster = () =>
    store<boolean>().get('showMaster', false);
export const setPersistedShowMaster = (visible: boolean) =>
    store().set('showMaster', visible);

export const persistedShowVsCode = () =>
    store<boolean>().get('showVsCode', false);
export const setPersistedShowVsCode = (visible: boolean) =>
    store().set('showVsCode', visible);
