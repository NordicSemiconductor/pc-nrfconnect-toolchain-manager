/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import { describeError, usageData } from 'pc-nrfconnect-shared';

import showErrorDialog from '../../../launcherActions';
import { Dispatch, Toolchain } from '../../../state';
import { installSdk } from '../../nrfUtilToolchainManager';
import {
    addTaskEvent,
    finishInstallToolchain,
    isLegacyEnvironment,
    setProgress,
    startInstallToolchain,
} from '../environmentReducer';
import { updateConfigFile } from '../segger';
import { downloadToolchain } from './downloadToolchain';
import { unpack } from './unpack';

export const installToolchain =
    (version: string, toolchain: Toolchain, toolchainDir: string) =>
    async (dispatch: Dispatch) => {
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
                dispatch(showErrorDialog(message));
                usageData.sendErrorReport(message);
            }
        } else {
            await installSdk(version, update => {
                dispatch(addTaskEvent({ version, payload: update }));
                switch (update.type) {
                    case 'task_begin':
                        dispatch(
                            setProgress(version, update.data.task.description)
                        );
                        break;
                    case 'task_progress':
                        dispatch(
                            setProgress(
                                version,
                                update.data.task.description,
                                update.data.progress.progressPercentage
                            )
                        );
                        break;
                }
                if (update.type === 'task_begin')
                    dispatch(
                        setProgress(version, update.data.task.description)
                    );
            });
        }

        dispatch(finishInstallToolchain(version, toolchainDir));
    };
