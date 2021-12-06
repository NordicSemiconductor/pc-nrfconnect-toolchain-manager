/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';
import { remote } from 'electron';
import os from 'os';
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

export enum NrfjprogStatus {
    NOT_INSTALLED,
    INSTALLED,
    M1_VERSION,
}

const checkExecArchitecture = async (exec: string) => {
    return new Promise<string>(resolve => {
        const spawnAsync = spawn(`file $(which ${exec})`, {
            shell: true,
            env: {
                ...remote.process.env,
                PATH: pathEnvVariable(),
            },
        });
        let stdout = '';
        spawnAsync.stdout.on('data', data => {
            stdout += data;
        });

        spawnAsync.on('close', async (code, signal) => {
            if (code === 0 && signal === null) {
                const universalMatch =
                    /Mach-O universal binary with 2 architectures/;
                const intelMatch = /Mach-O 64-bit executable x86_64/;
                if (stdout.match(universalMatch)) return resolve('universal');
                if (stdout.match(intelMatch)) return resolve('x86_64');
                return resolve('arm');
            }
        });
    });
};

export const isAppleSilicon =
    process.platform === 'darwin' && os.cpus()[0].model.includes('Apple');

const minDelay = 500;
export const checkOpenVsCodeWithDelay = () => async (dispatch: Dispatch) => {
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
            if (
                isAppleSilicon &&
                (await checkExecArchitecture('vscode')) !== 'x86_64'
            )
                status = VsCodeStatus.INSTALL_INTEL;
            else if (nrfjprog === NrfjprogStatus.NOT_INSTALLED)
                status = VsCodeStatus.MISSING_NRFJPROG;
            else if (nrfjprog === NrfjprogStatus.M1_VERSION)
                status = VsCodeStatus.NRFJPROG_INSTALL_INTEL;
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
    return new Promise<NrfjprogStatus>(resolve => {
        const spawnAsync = spawn('nrfjprog', {
            shell: true,
            env: {
                ...remote.process.env,
                PATH: pathEnvVariable(),
            },
        });

        spawnAsync.on('close', async (code, signal) => {
            if (code === 0 && signal === null) {
                if (
                    isAppleSilicon &&
                    (await checkExecArchitecture('jlink')) !== 'x86_64'
                )
                    return resolve(NrfjprogStatus.M1_VERSION);
                return resolve(NrfjprogStatus.INSTALLED);
            }
            return resolve(NrfjprogStatus.NOT_INSTALLED);
        });
    });
};

const pathEnvVariable = () => {
    if (process.platform !== 'darwin') return remote.process.env.PATH;

    return `/usr/local/bin:${remote.process.env.PATH}`;
};

const spawnAsync = (params: string[]) => {
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
