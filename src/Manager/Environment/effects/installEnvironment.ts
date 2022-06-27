/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';
import {
    describeError,
    ErrorDialogActions,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

import {
    persistedInstallDir as installDir,
    persistedShowVsCodeDialogDuringInstall,
    setPersistedShowVsCodeDialogDuringInstall,
} from '../../../persistentStore';
import { showReduxConfirmDialogAction } from '../../../ReduxConfirmDialog/reduxConfirmDialogSlice';
import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getVsCodeStatus } from '../../../VsCodeDialog/vscode';
import {
    setVsCodeStatus,
    showVsCodeDialog,
    VsCodeStatus,
} from '../../../VsCodeDialog/vscodeSlice';
import { getLatestToolchain } from '../../managerSlice';
import { isLegacyEnvironment } from '../environmentReducer';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import ensureMacCommandLineToolsInstall from './ensureMacCommandLineToolsInstall';
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
        const toolchainDir = isLegacyEnvironment(version)
            ? path.resolve(installDir(), version, 'toolchain')
            : path.resolve(installDir(), 'toolchains', version);
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
            if (abortController.signal.aborted) {
                removeUnfinishedInstallOnAbort(dispatch, version, toolchainDir);
                return;
            }
            if (!ensureMacCommandLineToolsInstall()) {
                dispatch(
                    showReduxConfirmDialogAction({
                        callback: () => {},
                        title: 'Please install Command Line Tools',
                        content:
                            'Please run ```xcode-select --install``` to install the command line tools.',
                        hideCancel: true,
                        confirmLabel: 'Confirm',
                    })
                );
            }
        } catch (error) {
            const message = describeError(error);
            dispatch(ErrorDialogActions.showDialog(`${message}`));
            usageData.sendErrorReport(`${message}`);
        }
    };
