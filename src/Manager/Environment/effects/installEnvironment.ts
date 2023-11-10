/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    describeError,
    ErrorDialogActions,
    logger,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import {
    persistedShowVsCodeDialogDuringInstall,
    setPersistedShowVsCodeDialogDuringInstall,
} from '../../../persistentStore';
import { Environment, RootState } from '../../../state';
import { getVsCodeStatus } from '../../../VsCodeDialog/vscode';
import {
    setVsCodeStatus,
    showVsCodeDialog,
    VsCodeStatus,
} from '../../../VsCodeDialog/vscodeSlice';
import toolchainPath from '../../toolchainPath';
import checkXcodeCommandLineTools from './checkXcodeCommandLineTools';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { installToolchain } from './installToolchain';
import { removeUnfinishedInstallOnAbort } from './removeEnvironment';

export const install =
    (
        { version }: Environment,
        justUpdate: boolean
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        logger.info(`Start to install toolchain ${version}`);

        if (persistedShowVsCodeDialogDuringInstall()) {
            dispatch(getVsCodeStatus()).then(status => {
                dispatch(setVsCodeStatus(status));
                if (status === VsCodeStatus.NOT_INSTALLED) {
                    dispatch(showVsCodeDialog());
                }
            });
            setPersistedShowVsCodeDialogDuringInstall(false);
        }

        try {
            await dispatch(
                ensureCleanTargetDir(version, toolchainPath(version))
            );
            await dispatch(installToolchain(version, abortController.signal));
            await dispatch(
                cloneNcs(version, justUpdate, abortController.signal)
            );

                    dispatch(checkXcodeCommandLineTools());
                } catch (error) {
                    logger.error(describeError(error));
                }
            }
        } catch (error) {
            dispatch(removeUnfinishedInstallOnAbort(version));
            const message = describeError(error);
            dispatch(ErrorDialogActions.showDialog(message));
            usageData.sendErrorReport(message);
        }
    };
