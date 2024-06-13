/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { app } from '@electron/remote';
import {
    AppThunk,
    logger,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

import { checkExecArchitecture, isAppleSilicon } from '../helpers';
import { RootState } from '../state';
import EventAction from '../usageDataActions';
import {
    hideVsCodeDialog,
    installedExtension,
    installExtensionFailed,
    setVsCodeExtensions,
    setVsCodeStatus,
    showVsCodeDialog,
    startInstallingExtensions,
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
    RECOMMEND_UNIVERSAL,
}

const minDelay = 500;
export const openVsCode =
    (skipCheck?: boolean): AppThunk<RootState> =>
    dispatch => {
        dispatch(hideVsCodeDialog());
        dispatch(setVsCodeStatus(VsCodeStatus.NOT_CHECKED));

        if (skipCheck) {
            dispatch(hideVsCodeDialog());
            spawnAsync('code');
            return;
        }

        const start = new Date();
        dispatch(getVsCodeStatus()).then(status => {
            if (status === VsCodeStatus.INSTALLED) {
                telemetry.sendEvent(EventAction.OPEN_VS_CODE, {
                    platform: process.platform,
                });
                dispatch(hideVsCodeDialog());
                spawnAsync('code');
            } else {
                dispatch(showVsCodeDialog());
                const end = new Date();
                const diff = minDelay - (+end - +start) / 1000;
                if (diff > 0)
                    setTimeout(() => dispatch(setVsCodeStatus(status)), diff);
                else dispatch(setVsCodeStatus(status));
            }
        });
    };

export const getVsCodeStatus =
    (): AppThunk<RootState, Promise<VsCodeStatus>> => async dispatch => {
        try {
            if (!(await isVsCodeInstalled())) {
                return VsCodeStatus.NOT_INSTALLED;
            }

            if (isAppleSilicon) {
                const vscode = await spawnAsync(
                    'file "$(dirname "$(readlink $(which code))")/../../../MacOS/Electron"'
                );
                if (checkExecArchitecture(vscode) === 'x86_64') {
                    return VsCodeStatus.RECOMMEND_UNIVERSAL;
                }
            }

            const extensions = await listInstalledExtensions(true);
            dispatch(setVsCodeExtensions(extensions));
            if (
                extensions.some(
                    extension =>
                        extension.state !== VsCodeExtensionState.INSTALLED
                )
            ) {
                return VsCodeStatus.MISSING_EXTENSIONS;
            }

            const nrfjprog = await getNrfjprogStatus();
            if (nrfjprog === NrfjprogStatus.NOT_INSTALLED) {
                return VsCodeStatus.MISSING_NRFJPROG;
            }
            if (nrfjprog === NrfjprogStatus.RECOMMEND_UNIVERSAL) {
                return VsCodeStatus.NRFJPROG_RECOMMEND_UNIVERSAL;
            }
        } catch {
            return VsCodeStatus.NOT_INSTALLED;
        }
        return VsCodeStatus.INSTALLED;
    };

export const installExtensions =
    (): AppThunk<RootState> => (dispatch, getState) => {
        dispatch(startInstallingExtensions());
        return vsCodeExtensions(getState()).reduce((promise, extension) => {
            if (extension.state !== VsCodeExtensionState.INSTALLED)
                return promise.then(
                    () =>
                        new Promise(resolve => {
                            dispatch(
                                installExtension(extension.identifier)
                            ).then(() => {
                                resolve();
                            });
                        })
                );
            return promise;
        }, Promise.resolve());
    };

const installExtension =
    (identifier: string): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        try {
            await spawnAsync('code', ['--install-extension', identifier]);
            const installedExtensions = await listInstalledExtensions();
            if (installedExtensions.some(e => e.identifier === identifier)) {
                dispatch(installedExtension(identifier));
                logger.info(`Installed extension ${identifier}`);
                return;
            }
        } catch {
            // Do nothing
        }
        dispatch(installExtensionFailed(identifier));
        logger.error(`Failed to install extension ${identifier}`);
    };

export const listInstalledExtensions = async (
    suppressOutputOnError?: boolean
): Promise<VsCodeExtension[]> => {
    const installedExtensions = (
        await spawnAsync('code', ['--list-extensions'], suppressOutputOnError)
    )
        .trim()
        .split('\n');
    return EXTENSIONS.map(extension => ({
        identifier: extension.id,
        name: extension.name,
        state: installedExtensions.includes(extension.id)
            ? VsCodeExtensionState.INSTALLED
            : VsCodeExtensionState.NOT_INSTALLED,
    }));
};

export const getNrfjprogStatus = async () => {
    try {
        await spawnAsync('nrfjprog', undefined, true);
        try {
            if (isAppleSilicon) {
                const stdout = await spawnAsync('file $(which JLinkExe)');
                if (checkExecArchitecture(stdout) === 'x86_64')
                    return NrfjprogStatus.RECOMMEND_UNIVERSAL;
            }
        } catch {
            return NrfjprogStatus.RECOMMEND_UNIVERSAL;
        }
        return NrfjprogStatus.INSTALLED;
    } catch {
        return NrfjprogStatus.NOT_INSTALLED;
    }
};

const pathEnvVariable = () => {
    if (process.platform !== 'darwin') return process.env;

    return {
        ...process.env,
        PATH: `/usr/local/bin:${process.env.PATH}`,
    };
};

const spawnAsync = (
    cmd: string,
    params?: string[],
    suppressOutputOnError = false
) =>
    new Promise<string>((resolve, reject) => {
        const codeProcess = spawn(cmd, params, {
            shell: true,
            env: pathEnvVariable(),
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
            if (stderr && !suppressOutputOnError) console.log(stderr);
            if (code === 0 && signal === null) {
                return resolve(stdout);
            }
            return reject();
        });
    });

const isVsCodeInstalledOnLinux = () =>
    app.getApplicationNameForProtocol('vscode://') !== '';

const isVsCodeInstalledOnMacOS = async () => {
    try {
        const { path } = await app.getApplicationInfoForProtocol('vscode://');

        return existsSync(path);
    } catch (error) {
        return false;
    }
};

const isVsCodeInstalledOnWindows = async () => {
    try {
        const { path } = await app.getApplicationInfoForProtocol('vscode://');

        return existsSync(join(dirname(path), 'bin', 'code'));
    } catch (error) {
        return false;
    }
};

export const isVsCodeInstalled = () => {
    switch (process.platform) {
        case 'linux':
            return isVsCodeInstalledOnLinux();
        case 'darwin':
            return isVsCodeInstalledOnMacOS();
        case 'win32':
            return isVsCodeInstalledOnWindows();
        default:
            throw new Error(`Unsupported platform ${process.platform}`);
    }
};
