/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    ErrorDialogActions,
    logger,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

import { RootState } from '../../../state';
import EventAction from '../../../usageDataActions';
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
    (
        version: string,
        justUpdate: boolean,
        controller: AbortController
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        if (controller.signal.aborted) {
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
                    await dispatch(initNrfUtil(version, controller));
                }
            }

            if (isLegacyEnvironment(version)) {
                await dispatch(updateLegacy(justUpdate, toolchainDir, version));
            } else {
                await dispatch(updateNrfUtil(version, controller));
            }
        } catch (error) {
            const errorMsg = `Failed to clone the repositories: ${error}`;
            dispatch(ErrorDialogActions.showDialog(errorMsg));
            usageData.sendErrorReport(errorMsg);
        }

        if (controller.signal.aborted) {
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

const initNrfUtil =
    (
        version: string,
        controller: AbortController
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        await fse.remove(path.resolve(sdkPath(version), '.west'));
        dispatch(setProgress(version, 'Initializing environment...'));
        logger.info(`Initializing environment for ${version}`);
        await westInit(version, controller);
    };

const updateNrfUtil =
    (
        version: string,
        controller: AbortController
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        await westUpdate(version, controller, update => {
            dispatch(updateProgress(update, version));
        });
        await westExport(version, controller);
    };

const updateLegacy =
    (
        justUpdate: boolean,
        toolchainDir: string,
        version: string
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
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
                const env = { ...process.env };
                delete env.ZEPHYR_BASE;

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
                dispatch(updateProgress(data, version));
            });
            ncsMgr.stderr?.on('data', data => {
                err += `${data}`;
            });
            ncsMgr.on('exit', code => (code ? reject(err) : resolve()));
        });
    };

const updateProgress =
    (data: Buffer | string, version: string): AppThunk =>
    dispatch => {
        const repo = (
            /=== updating ([^\s]+)/.exec(data.toString()) || []
        ).pop();
        if (repo) {
            dispatch(setProgress(version, `Updating ${repo} repository...`));
            logger.info(`Updating ${repo} repository for ${version}`);
        }
    };
