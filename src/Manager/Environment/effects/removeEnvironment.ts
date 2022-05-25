/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import {
    Dispatch,
    Environment,
    LegacyEnvironment,
    NrfUtilEnvironment,
} from '../../../state';
import EventAction from '../../../usageDataActions';
import {
    finishRemoving,
    removeEnvironmentReducer,
    startRemoving,
} from '../environmentReducer';
import { removeDir } from './removeDir';

export const removeEnvironment =
    (environment: Environment) => async (dispatch: Dispatch) => {
        if (environment.type === 'legacy') {
            await removeLegacyEnvironment(environment, dispatch);
        }
        if (environment.type === 'nrfUtil') {
            removeNrfUtilEnvironment(environment);
        }
    };

async function removeLegacyEnvironment(
    environment: LegacyEnvironment,
    dispatch: Dispatch
) {
    const { toolchainDir, version } = environment;
    logger.info(`Removing ${version} at ${toolchainDir}`);
    usageData.sendUsageData(EventAction.REMOVE_TOOLCHAIN, `${version}`);

    dispatch(startRemoving(version));

    if (await dispatch(removeDir(path.dirname(toolchainDir ?? '')))) {
        logger.info(`Finished removing ${version} at ${toolchainDir}`);
        dispatch(removeEnvironmentReducer(version));
    }

    dispatch(finishRemoving(version));
}

function removeNrfUtilEnvironment(environment: NrfUtilEnvironment) {
    logger.info(`Removing ${environment.version}`);
    logger.error('Not implemented');
}
