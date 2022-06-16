/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import removeToolchain from '../../nrfutil/remove';
import sdkPath from '../../sdkPath';
import {
    finishCancelInstall,
    finishRemoving,
    isLegacyEnvironment,
    removeEnvironmentReducer,
    startCancelInstall,
    startRemoving,
} from '../environmentReducer';
import { removeDir } from './removeDir';

const removeLegacyEnvironment = (dispatch: Dispatch, toolchainDir: string) =>
    removeDir(dispatch, path.dirname(toolchainDir));

const removeNrfutilEnvironment = (dispatch: Dispatch, version: string) =>
    Promise.all([
        removeToolchain(version),
        removeDir(dispatch, sdkPath(version)),
    ]);

export const removeEnvironment =
    (environment: Environment) => async (dispatch: Dispatch) => {
        const { toolchainDir, version } = environment;
        logger.info(`Removing ${version} at ${toolchainDir}`);
        usageData.sendUsageData(EventAction.REMOVE_TOOLCHAIN, `${version}`);

        dispatch(startRemoving(version));

        if (isLegacyEnvironment(version)) {
            await removeLegacyEnvironment(dispatch, toolchainDir);
        } else {
            await removeNrfutilEnvironment(dispatch, version);
        }

        logger.info(`Finished removing ${version} at ${toolchainDir}`);
        dispatch(removeEnvironmentReducer(version));

        dispatch(finishRemoving(version));
    };

export const removeUnfinishedInstallOnAbort = async (
    dispatch: Dispatch,
    version: string,
    toolchainDir: string
) => {
    dispatch(startCancelInstall(version));
    if (existsSync(toolchainDir)) {
        try {
            await rm(toolchainDir, { recursive: true, force: true });
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
