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

import { spawn } from 'child_process';
import { remote } from 'electron';

import { Dispatch, RootState } from '../state';
import {
    deselectExtension,
    installedExtension,
    installExtensionFailed,
    setVsCodeDialogVisible,
    setVsCodeExtensions,
    setVsCodeNrfjprogInstalled,
    setVsCodeStatus,
    startInstallingExtension,
    VsCodeExtension,
    vsCodeExtensions,
    VsCodeExtensionState,
    VsCodeStatus,
} from './vscodeSlice';

const EXTENSIONS = [
    {
        required: true,
        id: 'nordic-semiconductor.nrf-connect',
        name: 'Nrf Connect',
    },
    { required: true, id: 'marus25.cortex-debug', name: 'Cortex-Debug' },
    {
        required: false,
        id: 'nordic-semiconductor.nrf-terminal',
        name: 'Nrf Terminal',
    },
    { required: false, id: 'luveti.kconfig', name: 'kconfig' },
    { required: false, id: 'plorefice.devicetree', name: 'DeviceTree' },
    { required: false, id: 'ms-vscode.cpptools', name: 'C/C++' },
];

export const showVsCodeDialog = () => (dispatch: Dispatch) => {
    dispatch(setVsCodeStatus(VsCodeStatus.NOT_CHECKED));
    dispatch(setVsCodeDialogVisible());
    return dispatch(getVsCodeStatus()).then(status => Promise.resolve(status));
};

export const getVsCodeStatus = () => async (dispatch: Dispatch) => {
    let status = VsCodeStatus.NOT_CHECKED;
    try {
        const extensions = await listInstalledExtensions();
        dispatch(setVsCodeExtensions(extensions));
        const nrfjprog = await getNrfjprogStatus();
        dispatch(setVsCodeNrfjprogInstalled(nrfjprog));
        if (
            extensions.some(
                extension =>
                    extension.required &&
                    extension.state !== VsCodeExtensionState.INSTALLED
            ) ||
            !nrfjprog
        )
            status = VsCodeStatus.MISSING_TOOLS;
        else status = VsCodeStatus.INSTALLED;
    } catch {
        status = VsCodeStatus.NOT_INSTALLED;
    }
    dispatch(setVsCodeStatus(status));
    return Promise.resolve(status);
};

export const installExtensions =
    () => (dispatch: Dispatch, getState: () => RootState) =>
        vsCodeExtensions(getState()).forEach(extension => {
            if (extension.selected)
                dispatch(installExtension(extension.identifier));
        });

const installExtension = (identifier: string) => async (dispatch: Dispatch) => {
    try {
        dispatch(startInstallingExtension(identifier));
        await spawnAsync(['--install-extension', identifier]);
        dispatch(deselectExtension(identifier));
        dispatch(installedExtension(identifier));
    } catch {
        dispatch(installExtensionFailed(identifier));
    }
};

export const listInstalledExtensions = async (): Promise<VsCodeExtension[]> => {
    const installedExtensions = await spawnAsync(['--list-extensions']);
    return EXTENSIONS.map(extension => ({
        identifier: extension.id,
        name: extension.name,
        required: extension.required,
        state: installedExtensions.includes(extension.id)
            ? VsCodeExtensionState.INSTALLED
            : VsCodeExtensionState.NOT_INSTALLED,
        selected: !installedExtensions.includes(extension.id),
    }));
};

const getNrfjprogStatus = async () => {
    return new Promise<boolean>(resolve => {
        const spawnAsync = spawn('nrfjprog', {
            shell: true,
        });

        spawnAsync.on('close', (code, signal) => {
            if (code === 0 && signal === null) {
                return resolve(true);
            }
            return resolve(false);
        });
    });
};

const pathEnvVariable = () => {
    if (process.platform !== 'darwin') return remote.process.env.PATH;

    return `/usr/local/bin:${remote.process.env.PATH}`;
};

const spawnAsync = async (params: string[]) => {
    return new Promise<string[]>((resolve, reject) => {
        const codeProcess = spawn('code', params, {
            shell: true,
            env: {
                ...remote.process.env,
                PATH: pathEnvVariable(),
            },
        });
        let stdout = '';
        let stderr = '';
        codeProcess.stdout.on('data', data => {
            stdout += data;
        });
        codeProcess.stderr.on('data', data => {
            stderr += data;
        });

        codeProcess.on('close', (code, signal) => {
            if (code === 0 && signal === null) {
                if (stderr) console.log(stderr);
                return resolve(stdout.trim().split('\n'));
            }
            return reject();
        });
    });
};

export const openVsCode = () => {
    spawnAsync([]);
};
