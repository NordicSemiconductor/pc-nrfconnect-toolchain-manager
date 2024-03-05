/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    logger,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import fse from 'fs-extra';

import { persistedInstallDir } from '../../../persistentStore';
import { RootState } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getEnvironment, getLatestToolchain } from '../../managerSlice';
import toolchainManager from '../../ToolchainManager/toolchainManager';
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
            const toolchainDir = await toolchainPath(version);
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

            telemetry.sendEvent(EventAction.INSTALL_TOOLCHAIN_FROM_INDEX, {
                version,
                toolchainVersion: toolchain?.version,
            });
            dispatch(finishInstallToolchain(version, toolchainDir));
        } else {
            const result = await toolchainManager.install(
                version,
                persistedInstallDir(),
                undefined,
                (progress, task) => {
                    dispatch(
                        setProgress(
                            version,
                            task?.description ?? '',
                            progress.totalProgressPercentage
                        )
                    );
                },
                controller
            );

            telemetry.sendEvent(EventAction.INSTALL_TOOLCHAIN_FROM_NRFUTIL, {
                version,
                nrfutilToolchainVersion: result.install_path,
            });
            dispatch(finishInstallToolchain(version, result.install_path));
        }
    };
