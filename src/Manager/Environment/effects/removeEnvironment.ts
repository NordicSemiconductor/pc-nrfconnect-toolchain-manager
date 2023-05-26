/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { existsSync } from 'fs';
import { rename, rm } from 'fs/promises';
import path from 'path';
import { ErrorDialogActions, logger, usageData } from 'pc-nrfconnect-shared';
import { TDispatch } from 'pc-nrfconnect-shared/src/state';

import { Dispatch, Environment, RootState } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getEnvironment } from '../../managerSlice';
import removeToolchain from '../../nrfutil/remove';
import sdkPath from '../../sdkPath';
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
        pathToRemove = sdkPath(version);
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
        await rm(sdkPath(version), { recursive: true, force: true });
        await removeToolchain(version);
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
    (environment: Environment) => async (dispatch: Dispatch) => {
        const { toolchainDir, version } = environment;
        logger.info(`Removing ${version} at ${toolchainDir}`);
        usageData.sendUsageData(EventAction.REMOVE_TOOLCHAIN, `${version}`);

        dispatch(startRemoving(version));

        try {
            if (isLegacyEnvironment(version)) {
                await removeLegacyEnvironment(toolchainDir);
                logger.info(`Finished removing ${version} at ${toolchainDir}`);
            } else {
                await removeNrfutilEnvironment(version, toolchainDir);
                logger.info(
                    `Finished removing ${version} at ${toolchainDir} and ${sdkPath(
                        version
                    )}`
                );
            }
            dispatch(removeEnvironmentReducer(version));
        } catch (err) {
            dispatch(ErrorDialogActions.showDialog((err as Error).message));
            usageData.sendErrorReport((err as Error).message);
        }

        dispatch(finishRemoving(version));
    };

export const removeUnfinishedInstallOnAbort =
    (version: string) =>
    async (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(startCancelInstall(version));
        const toolchainDir = isLegacyEnvironment(version)
            ? dispatch(getEnvironment(getState(), version)).toolchainDir
            : toolchainPath(version);
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
        if (existsSync(sdkPath(version))) {
            try {
                await rm(sdkPath(version), { recursive: true, force: true });
                logger.info(
                    `Successfully removed SDK with version ${version} from ${sdkPath(
                        version
                    )}`
                );
            } catch (err) {
                logger.error(err);
            }
        }
        dispatch(finishCancelInstall(version));
    };
