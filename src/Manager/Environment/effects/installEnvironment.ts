/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import showErrorDialog from '../../../launcherActions';
import {
    persistedInstallDir as installDir,
    persistedShowVsCodeDialogDuringInstall,
    setHasInstalledAnNcs,
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
import { getLatestToolchain, selectEnvironment } from '../../managerSlice';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { getErrorMessage, installToolchain } from './installToolchain';

// eslint-disable-next-line import/prefer-default-export
export const install =
    ({ version, toolchains }: Environment, justUpdate: boolean) =>
    async (dispatch: Dispatch) => {
        logger.info(`Start to install toolchain ${version}`);
        const toolchain = getLatestToolchain(toolchains);
        const toolchainDir = path.resolve(installDir(), version, 'toolchain');
        logger.info(`Installing ${toolchain?.name} at ${toolchainDir}`);
        logger.debug(`Install with toolchain version ${toolchain?.version}`);
        logger.debug(`Install with sha512 ${toolchain?.sha512}`);
        usageData.sendUsageData(
            EventAction.INSTALL_TOOLCHAIN_FROM_INDEX,
            `${version}; ${toolchain?.name}`
        );

        dispatch(selectEnvironment(version));

        setHasInstalledAnNcs();

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
            if (toolchain === undefined) throw new Error('No toolchain found');
            await dispatch(ensureCleanTargetDir(toolchainDir));
            await dispatch(installToolchain(version, toolchain, toolchainDir));
            await dispatch(cloneNcs(version, toolchainDir, justUpdate));
        } catch (error) {
            const message = getErrorMessage(error);
            dispatch(showErrorDialog(`${message}`));
            usageData.sendErrorReport(`${message}`);
        }
    };
