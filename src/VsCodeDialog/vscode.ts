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
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch, RootState } from '../state';
import EventAction from '../usageDataActions';
import {
    hideVsCodeDialog,
    installedExtension,
    installExtensionFailed,
    setVsCodeExtensions,
    setVsCodeStatus,
    showVsCodeDialog,
    startInstallingExtension,
    VsCodeExtension,
    vsCodeExtensions,
    VsCodeExtensionState,
    VsCodeStatus,
} from './vscodeSlice';

const EXTENSIONS = [
    {
        id: 'nordic-semiconductor.nrf-connect',
        name: 'nRF Connect',
    },
    { id: 'marus25.cortex-debug', name: 'Cortex-Debug' },
    {
        id: 'nordic-semiconductor.nrf-terminal',
        name: 'nRF Terminal',
    },
    {
        id: 'nordic-semiconductor.nrf-kconfig',
        name: 'nRF Kconfig',
    },
    {
        id: 'nordic-semiconductor.nrf-devicetree',
        name: 'nRF DeviceTree',
    },
    { id: 'ms-vscode.cpptools', name: 'C/C++' },
    { id: 'trond-snekvik.gnu-mapfiles', name: 'GNU Linker Map Files' },
    { id: 'twxs.cmake', name: 'CMake' },
];

const minDelay = 500;
export const checkOpenVsCodeWithDelay = () => (dispatch: Dispatch) => {
    dispatch(setVsCodeStatus(VsCodeStatus.NOT_CHECKED));
    dispatch(showVsCodeDialog());

    const start = new Date();
    dispatch(getVsCodeStatus()).then(status => {
        if (status === VsCodeStatus.INSTALLED) {
            dispatch(hideVsCodeDialog());
            openVsCode();
        } else {
            const end = new Date();
            const diff = minDelay - (+end - +start) / 1000;
            if (diff > 0)
                setTimeout(() => dispatch(setVsCodeStatus(status)), diff);
            else dispatch(setVsCodeStatus(status));
        }
    });
};

export const getVsCodeStatus = () => async (dispatch: Dispatch) => {
    let status = VsCodeStatus.NOT_CHECKED;
    try {
        const extensions = await listInstalledExtensions();
        dispatch(setVsCodeExtensions(extensions));
        if (
            extensions.some(
                extension => extension.state !== VsCodeExtensionState.INSTALLED
            )
        )
            status = VsCodeStatus.MISSING_EXTENSIONS;
        else {
            const nrfjprog = await getNrfjprogStatus();
            if (!nrfjprog) status = VsCodeStatus.MISSING_NRFJPROG;
            else status = VsCodeStatus.INSTALLED;
        }
    } catch {
        status = VsCodeStatus.NOT_INSTALLED;
    }
    return Promise.resolve(status);
};

export const installExtensions =
    () => (dispatch: Dispatch, getState: () => RootState) =>
        vsCodeExtensions(getState()).forEach(extension => {
            if (extension.state !== VsCodeExtensionState.INSTALLED)
                dispatch(installExtension(extension.identifier));
        });

const installExtension = (identifier: string) => async (dispatch: Dispatch) => {
    try {
        dispatch(startInstallingExtension(identifier));
        await spawnAsync(['--install-extension', identifier]);
        dispatch(installedExtension(identifier));
        logger.info(`Installed extension ${identifier}`);
    } catch {
        dispatch(installExtensionFailed(identifier));
        logger.error(`Failed to install extension ${identifier}`);
    }
};

export const listInstalledExtensions = async (): Promise<VsCodeExtension[]> => {
    const installedExtensions = await spawnAsync(['--list-extensions']);
    return EXTENSIONS.map(extension => ({
        identifier: extension.id,
        name: extension.name,
        state: installedExtensions.includes(extension.id)
            ? VsCodeExtensionState.INSTALLED
            : VsCodeExtensionState.NOT_INSTALLED,
    }));
};

export const getNrfjprogStatus = async () => {
    return new Promise<boolean>(resolve => {
        const spawnAsync = spawn('nrfjprog', {
            shell: true,
            env: {
                ...remote.process.env,
                PATH: pathEnvVariable(),
            },
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
                return resolve(stdout.trim().split('\n'));
            }
            if (stderr) console.log(stderr);
            return reject();
        });
    });
};

export const openVsCode = () => {
    usageData.sendUsageData(EventAction.OPEN_VS_CODE, process.platform);
    spawnAsync([]);
};
