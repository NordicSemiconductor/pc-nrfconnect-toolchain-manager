/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import {
    finishRemoving,
    removeEnvironmentReducer,
    startRemoving,
} from '../environmentReducer';
import { removeDir } from './removeDir';

// eslint-disable-next-line import/prefer-default-export
export const removeEnvironment =
    ({ toolchainDir, version }: Environment) =>
    async (dispatch: Dispatch) => {
        logger.info(`Removing ${version} at ${toolchainDir}`);
        usageData.sendUsageData(EventAction.REMOVE_TOOLCHAIN, `${version}`);

        dispatch(startRemoving(version));

        if (await dispatch(removeDir(path.dirname(toolchainDir ?? '')))) {
            logger.info(`Finished removing ${version} at ${toolchainDir}`);
            dispatch(removeEnvironmentReducer(version));
        }

        dispatch(finishRemoving(version));
    };
