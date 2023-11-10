/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    ErrorDialogActions,
    logger,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import { westExport, westInit, westUpdate } from '../../nrfutil/west';
import sdkPath from '../../sdkPath';
import toolchainPath from '../../toolchainPath';
import {
    finishCloningSdk,
    isLegacyEnvironment,
    setProgress,
    startCloningSdk,
} from '../environmentReducer';
import { calculateTimeConsumed, isWestPresent } from './helpers';

export const cloneNcs =
    (version: string, justUpdate: boolean, signal: AbortSignal) =>
    async (dispatch: Dispatch) => {
        if (signal.aborted) {
            return;
        }
        dispatch(startCloningSdk(version));
        logger.info(`Cloning nRF Connect SDK ${version}`);

        usageData.sendUsageData(EventAction.CLONE_NCS, {
            version,
            platform: process.platform,
            arch: process.arch,
        });
        const cloneTimeStart = new Date();
        const toolchainDir = toolchainPath(version);

        try {
            if (!justUpdate) {
                if (isLegacyEnvironment(version)) {
                    await initLegacy(toolchainDir);
                } else {
                    await initNrfUtil(version, signal, dispatch);
                }
            }

            if (isLegacyEnvironment(version)) {
                await updateLegacy(justUpdate, toolchainDir, dispatch, version);
            } else {
                await updateNrfUtil(version, dispatch, signal);
            }
        } catch (error) {
            const errorMsg = `Failed to clone the repositories: ${error}`;
            dispatch(ErrorDialogActions.showDialog(errorMsg));
            usageData.sendErrorReport(errorMsg);
        }

        if (signal.aborted) {
            return;
        }

        dispatch(
            finishCloningSdk(version, isWestPresent(version, toolchainDir))
        );

        const timeInMin = calculateTimeConsumed(cloneTimeStart);
        usageData.sendUsageData(EventAction.CLONE_NCS_SUCCESS, {
            version,
            platform: process.platform,
            arch: process.arch,
        });
        usageData.sendUsageData(EventAction.CLONE_NCS_TIME, {
            timeInMin,
            version,
        });
        logger.info(
            `Finished cloning version ${version} of the nRF Connect SDK after approximately ${timeInMin} minute(s)`
        );
    };

async function initLegacy(toolchainDir: string) {
    await fse.remove(path.resolve(path.dirname(toolchainDir), '.west'));
}

async function initNrfUtil(
    version: string,
    signal: AbortSignal,
    dispatch: Dispatch
) {
    await fse.remove(path.resolve(sdkPath(version), '.west'));
    dispatch(setProgress(version, 'Initializing environment...'));
    logger.info(`Initializing environment for ${version}`);
    await westInit(version, signal);
}

async function updateNrfUtil(
    version: string,
    dispatch: Dispatch,
    signal: AbortSignal
) {
    await westUpdate(version, signal, update => {
        updateProgress(update, dispatch, version);
    });
    await westExport(version, signal);
}

async function updateLegacy(
    justUpdate: boolean,
    toolchainDir: string,
    dispatch: Dispatch,
    version: string
) {
    let ncsMgr: ChildProcess;
    const update = justUpdate ? '--just-update' : '';
    switch (process.platform) {
        case 'win32': {
            ncsMgr = spawn(path.resolve(toolchainDir, 'bin', 'bash.exe'), [
                '-l',
                '-c',
                `unset ZEPHYR_BASE ; ncsmgr/ncsmgr init-ncs ${update}`,
            ]);

            break;
        }
        case 'darwin': {
            const { ZEPHYR_BASE, ...env } = process.env;
            const gitversion = fs
                .readdirSync(`${toolchainDir}/Cellar/git`)
                .pop();
            env.PATH = `${toolchainDir}/bin:${process.env.PATH}`;
            env.GIT_EXEC_PATH = `${toolchainDir}/Cellar/git/${gitversion}/libexec/git-core`;
            env.HOME = `${process.env.HOME}`;

            ncsMgr = spawn(
                `${toolchainDir}/ncsmgr/ncsmgr`,
                ['init-ncs', `${update}`],
                { env }
            );
            break;
        }
        default:
    }

    dispatch(setProgress(version, 'Initializing environment...'));
    logger.info(`Initializing environment for ${version}`);
    let err = '';
    await new Promise<void>((resolve, reject) => {
        ncsMgr.stdout?.on('data', data => {
            updateProgress(data, dispatch, version);
        });
        ncsMgr.stderr?.on('data', data => {
            err += `${data}`;
        });
        ncsMgr.on('exit', code => (code ? reject(err) : resolve()));
    });
}

function updateProgress(
    data: Buffer | string,
    dispatch: Dispatch,
    version: string
) {
    const repo = (/=== updating ([^\s]+)/.exec(data.toString()) || []).pop();
    if (repo) {
        dispatch(setProgress(version, `Updating ${repo} repository...`));
        logger.info(`Updating ${repo} repository for ${version}`);
    }
}
