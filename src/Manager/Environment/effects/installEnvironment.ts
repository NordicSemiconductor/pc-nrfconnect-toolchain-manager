/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    describeError,
    ErrorDialogActions,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

import {
    persistedShowVsCodeDialogDuringInstall,
    setPersistedShowVsCodeDialogDuringInstall,
} from '../../../persistentStore';
import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getVsCodeStatus } from '../../../VsCodeDialog/vscode';
import {
    setVsCodeStatus,
    showVsCodeDialog,
    VsCodeStatus,
} from '../../../VsCodeDialog/vscodeSlice';
import { getLatestToolchain } from '../../managerSlice';
import toolchainPath from '../../toolchainPath';
import checkXcodeCommandLineTools from './checkXcodeCommandLineTools';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { installToolchain } from './installToolchain';
import { removeUnfinishedInstallOnAbort } from './removeEnvironment';

export const install =
    ({ version, type, abortController }: Environment, justUpdate: boolean) =>
    async (dispatch: Dispatch) => {
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
        } catch (error) {
            removeUnfinishedInstallOnAbort(dispatch, version);
            const message = describeError(error);
            dispatch(ErrorDialogActions.showDialog(message));
            usageData.sendErrorReport(message);
        }

        if (abortController.signal.aborted) {
            removeUnfinishedInstallOnAbort(dispatch, version);
        } else {
            try {
                checkXcodeCommandLineTools(dispatch);
            } catch (error) {
                logger.error(describeError(error));
            }
        }
    };
