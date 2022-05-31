/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import removeToolchain from '../../nrfutil/remove';
import sdkPath from '../../sdkPath';
import {
    finishRemoving,
    isLegacyEnvironment,
    removeEnvironmentReducer,
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
