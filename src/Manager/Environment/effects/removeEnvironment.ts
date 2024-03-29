/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    ErrorDialogActions,
    logger,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { existsSync } from 'fs';
import { rename, rm } from 'fs/promises';
import path from 'path';

import { persistedInstallDir } from '../../../persistentStore';
import { Environment, RootState } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getEnvironment } from '../../managerSlice';
import sdkPath from '../../sdkPath';
import toolchainManager from '../../ToolchainManager/toolchainManager';
import toolchainPath from '../../toolchainPath';
import {
    finishCancelInstall,
    finishRemoving,
    isLegacyEnvironment,
    removeEnvironmentReducer,
    startCancelInstall,
    startRemoving,
} from '../environmentReducer';
import { removeDir } from './removeDir';

const removeLegacyEnvironment = (toolchainDir: string) =>
    removeDir(path.dirname(toolchainDir));

const renamedPath = (origPath: string) =>
    path.resolve(origPath, '..', 'toBeDeleted');

const removeNrfutilEnvironment = async (
    version: string,
    toolchainDir: string
) => {
    let pathToRemove;
    try {
        pathToRemove = await sdkPath(version);
        await rename(pathToRemove, renamedPath(pathToRemove));
        await rename(renamedPath(pathToRemove), pathToRemove);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        const errorMsg =
            `Failed to remove ${pathToRemove}, ${message}. ` +
            'Please close any application or window that might keep this ' +
            'environment locked, then try to remove it again.';

        throw new Error(errorMsg);
    }

    try {
        const installDir = await sdkPath(version);
        await rm(installDir, { recursive: true, force: true });
        await toolchainManager.uninstall(version, persistedInstallDir());
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        throw new Error(
            `Unexpected error when removing SDK ${version}, ${message}. ` +
                `Please remove the installation in ${sdkPath(
                    version
                )} and ${toolchainDir} manually as it is broken.`
        );
    }
};

export const removeEnvironment =
    (environment: Environment): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        const { toolchainDir, version } = environment;
        logger.info(`Removing ${version} at ${toolchainDir}`);
        telemetry.sendEvent(EventAction.REMOVE_TOOLCHAIN, { version });

        dispatch(startRemoving(version));

        try {
            if (isLegacyEnvironment(version)) {
                await removeLegacyEnvironment(toolchainDir);
                logger.info(`Finished removing ${version} at ${toolchainDir}`);
            } else {
                await removeNrfutilEnvironment(version, toolchainDir);
                const installDir = await sdkPath(version);
                logger.info(
                    `Finished removing ${version} at ${toolchainDir} and ${installDir}`
                );
            }
            dispatch(removeEnvironmentReducer(version));
        } catch (err) {
            dispatch(ErrorDialogActions.showDialog((err as Error).message));
            telemetry.sendErrorReport((err as Error).message);
        }

        dispatch(finishRemoving(version));
    };

export const removeUnfinishedInstallOnAbort =
    (version: string): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        dispatch(startCancelInstall(version));
        const toolchainDir = isLegacyEnvironment(version)
            ? await toolchainPath(version)
            : dispatch(getEnvironment(getState(), version)).toolchainDir;
        if (existsSync(toolchainDir)) {
            try {
                if (isLegacyEnvironment(version)) {
                    await rm(toolchainDir, { recursive: true, force: true });
                } else {
                    await removeNrfutilEnvironment(version, toolchainDir);
                }
                logger.info(
                    `Successfully removed toolchain directory: ${toolchainDir}`
                );
            } catch (err) {
                logger.error(err);
            }
        }
        const installDir = await sdkPath(version);

        if (existsSync(installDir)) {
            try {
                await rm(installDir, { recursive: true, force: true });
                logger.info(
                    `Successfully removed SDK with version ${version} from ${installDir}`
                );
            } catch (err) {
                logger.error(err);
            }
        }
        dispatch(finishCancelInstall(version));
    };
