/* Copyright (c) 2015 - 2021, Nordic Semiconductor ASA
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

import { spawnSync } from 'child_process';

export const REQUIRED_EXTENSIONS = [
    'nordic-semiconductor.nrf-connect',
    'marus25.cortex-debug',
];
export const RECOMENDED_EXTENSIONS = [
    'nordic-semiconductor.nrf-terminal',
    'luveti.kconfig',
    'plorefice.devicetree',
    'ms-vscode.cpptools',
];

export enum VsCodeStatus {
    INSTALLED,
    EXTENSIONS_MISSING,
    NOT_INSTALLED,
}

export const getVsCodeStatus = () => {
    const extensions = listInstalledExtensions();

    if (extensions === null) {
        return VsCodeStatus.NOT_INSTALLED;
    }

    const hasRequiredExtensions = REQUIRED_EXTENSIONS.every(extension =>
        extensions?.includes(extension)
    );

    return hasRequiredExtensions
        ? VsCodeStatus.INSTALLED
        : VsCodeStatus.EXTENSIONS_MISSING;
};

export const installExtensions = () => {
    const existing = listInstalledExtensions();
    const missing = [...REQUIRED_EXTENSIONS, ...RECOMENDED_EXTENSIONS].filter(
        identifier => !existing?.includes(identifier)
    );
    missing.forEach(extension => installExtension(extension));
};

const installExtension = (identifier: string) => {
    const pathOrIdentifier = identifier;

    return spawnSync('code', ['--install-extension', pathOrIdentifier], {
        shell: true,
    }).status;
};

export const listInstalledExtensions = () => {
    const { stdout, status, error } = spawnSync('code', ['--list-extensions'], {
        shell: true,
        encoding: 'utf-8',
    });

    if (error || status !== 0) {
        return undefined;
    }

    return stdout.trim().split('\n');
};

export function openVsCode() {
    spawnSync('code', {
        shell: true,
    });
}
