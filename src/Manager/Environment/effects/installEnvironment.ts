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
    (
        { version, toolchains, type, abortController }: Environment,
        justUpdate: boolean
    ) =>
    async (dispatch: Dispatch) => {
        logger.info(`Start to install toolchain ${version}`);
        const toolchain = getLatestToolchain(toolchains);
        const toolchainDir = toolchainPath(version);
        logger.info(`Installing ${toolchain?.name} at ${toolchainDir}`);
        logger.debug(`Install with toolchain version ${toolchain?.version}`);
        logger.debug(`Install with sha512 ${toolchain?.sha512}`);

        if (persistedShowVsCodeDialogDuringInstall()) {
            dispatch(getVsCodeStatus()).then(status => {
                dispatch(setVsCodeStatus(status));
                if (status === VsCodeStatus.NOT_INSTALLED) {
                    dispatch(showVsCodeDialog());
                }
            });
            setPersistedShowVsCodeDialogDuringInstall(false);
        }

        usageData.sendUsageData(
            type === 'legacy'
                ? EventAction.INSTALL_TOOLCHAIN_FROM_INDEX
                : EventAction.INSTALL_TOOLCHAIN_FROM_NRFUTIL,
            `${version}; ${toolchain?.name}`
        );

        try {
            if (toolchain === undefined) throw new Error('No toolchain found');
            await dispatch(ensureCleanTargetDir(version, toolchainDir));
            await dispatch(
                installToolchain(
                    version,
                    toolchain,
                    toolchainDir,
                    abortController.signal
                )
            );
            await dispatch(
                cloneNcs(
                    version,
                    toolchainDir,
                    justUpdate,
                    abortController.signal
                )
            );
        } catch (error) {
            removeUnfinishedInstallOnAbort(dispatch, version, toolchainDir);
            dispatch(ErrorDialogActions.showDialog((error as Error).message));
            usageData.sendErrorReport((error as Error).message);
        }

        if (abortController.signal.aborted) {
            removeUnfinishedInstallOnAbort(dispatch, version, toolchainDir);
        } else {
            try {
                checkXcodeCommandLineTools(dispatch);
            } catch (error) {
                logger.error(describeError(error));
            }
        }
    };
