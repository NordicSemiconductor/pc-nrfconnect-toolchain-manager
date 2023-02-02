/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import {
    describeError,
    ErrorDialogActions,
    usageData,
} from 'pc-nrfconnect-shared';

import { Dispatch, Toolchain } from '../../../state';
import installNrfutilToolchain from '../../nrfutil/install';
import { describe } from '../../nrfutil/task';
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
        toolchain: Toolchain,
        toolchainDir: string,
        signal: AbortSignal
    ) =>
    async (dispatch: Dispatch) => {
        if (signal.aborted) {
            return;
        }

        dispatch(startInstallToolchain(version));

        if (isLegacyEnvironment(version)) {
            try {
                fse.mkdirpSync(toolchainDir);
                const packageLocation = await dispatch(
                    downloadToolchain(version, toolchain)
                );
                await dispatch(unpack(version, packageLocation, toolchainDir));
                updateConfigFile(toolchainDir);
            } catch (error) {
                const message = describeError(error);
                dispatch(ErrorDialogActions.showDialog(message));
                usageData.sendErrorReport(message);
            }
        } else {
            try {
                await installNrfutilToolchain(
                    version,
                    update => {
                        switch (update.type) {
                            case 'task_begin':
                                dispatch(
                                    setProgress(
                                        version,
                                        describe(update.data.task)
                                    )
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
                        }
                    },
                    signal
                );
            } catch (e) {
                console.log(e as Error);
                dispatch(finishInstallToolchain(version, toolchainDir));
                // This error should be reclassified as a warning/info in a newer version of nrfutil
                if (!(e as Error).toString().includes('already exists')) {
                    throw e;
                }
            }
        }

        dispatch(finishInstallToolchain(version, toolchainDir));
    };
