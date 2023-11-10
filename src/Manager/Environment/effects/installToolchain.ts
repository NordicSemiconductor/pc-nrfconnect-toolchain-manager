/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    logger,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import logger from 'pc-nrfconnect-shared/src/logging';

import { Dispatch, RootState, Toolchain } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getEnvironment, getLatestToolchain } from '../../managerSlice';
import installNrfutilToolchain from '../../nrfutil/install';
import { describe } from '../../nrfutil/task';
import toolchainPath from '../../toolchainPath';
import {
    finishInstallToolchain,
    isLegacyEnvironment,
    setProgress,
    startInstallToolchain,
} from '../environmentReducer';
import { updateConfigFile } from '../segger';
import { downloadToolchain } from './downloadToolchain';
import { unpack } from './unpack';

export const installToolchain =
    (
        version: string,
        controller: AbortController
    ): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        if (controller.signal.aborted) {
            return;
        }

        dispatch(startInstallToolchain(version));

        if (isLegacyEnvironment(version)) {
            const toolchain = getLatestToolchain(
                dispatch(getEnvironment(getState(), version)).toolchains
            );
            if (toolchain === undefined) {
                throw new Error('No toolchain found');
            }
            const toolchainDir = toolchainPath(version);
            logger.info(`Installing ${toolchain?.name} at ${toolchainDir}`);
            logger.debug(
                `Install with toolchain version ${toolchain?.version}`
            );
            logger.debug(`Install with sha512 ${toolchain?.sha512}`);
            fse.mkdirpSync(toolchainDir);
            const packageLocation = await dispatch(
                downloadToolchain(version, toolchain)
            );
            await dispatch(unpack(version, packageLocation, toolchainDir));
            updateConfigFile(toolchainDir);

            usageData.sendUsageData(EventAction.INSTALL_TOOLCHAIN_FROM_INDEX, {
                version,
                toolchainVersion: toolchain?.version,
            });
            dispatch(finishInstallToolchain(version, toolchainDir));
        } else {
            await installNrfutilToolchain(
                version,
                update => {
                    switch (update.type) {
                        case 'task_begin':
                            dispatch(
                                setProgress(version, describe(update.data.task))
                            );
                            break;
                        case 'task_progress':
                            dispatch(
                                setProgress(
                                    version,
                                    describe(update.data.task),
                                    update.data.progress.progressPercentage
                                )
                            );
                            break;
                        case 'task_end':
                            if (update.data.task.name === 'install_toolchain') {
                                usageData.sendUsageData(
                                    EventAction.INSTALL_TOOLCHAIN_FROM_NRFUTIL,
                                    `${version}; ${update.data.task.data.install_path}`
                                );
                                dispatch(
                                    finishInstallToolchain(
                                        version,
                                        update.data.task.data.install_path
                                    )
                                );
                            }
                    }
                },
                signal
            );
        }
    };
