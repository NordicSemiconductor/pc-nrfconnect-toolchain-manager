/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';
import { describeError, logger, usageData } from 'pc-nrfconnect-shared';

import showErrorDialog from '../../../launcherActions';
import {
    persistedInstallDir as installDir,
    persistedShowVsCodeDialogDuringInstall,
    setHasInstalledAnNcs,
    setPersistedShowVsCodeDialogDuringInstall,
} from '../../../persistentStore';
import { Dispatch, Environment, Toolchain } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getVsCodeStatus } from '../../../VsCodeDialog/vscode';
import {
    setVsCodeStatus,
    showVsCodeDialog,
    VsCodeStatus,
} from '../../../VsCodeDialog/vscodeSlice';
import { getLatestToolchain, selectEnvironment } from '../../managerSlice';
import { installSdk } from '../../nrfUtilToolchainManager';
import { addTaskEvent } from '../nrfUtilEnvironmentSlice';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { installToolchain } from './installToolchain';

export const install =
    ({ version, toolchains, type }: Environment, justUpdate: boolean) =>
    async (dispatch: Dispatch) => {
        logger.info(`Start to install toolchain ${version}`);
        const toolchain = getLatestToolchain(toolchains);
        const toolchainDir = path.resolve(installDir(), version, 'toolchain');
        logger.info(`Installing ${toolchain?.name} at ${toolchainDir}`);
        logger.debug(`Install with toolchain version ${toolchain?.version}`);
        logger.debug(`Install with sha512 ${toolchain?.sha512}`);

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

        if (type === 'legacy') {
            usageData.sendUsageData(
                EventAction.INSTALL_TOOLCHAIN_FROM_INDEX,
                `${version}; ${toolchain?.name}`
            );

            await installLegacy(
                toolchain,
                dispatch,
                toolchainDir,
                version,
                justUpdate
            );
        }

        if (type === 'nrfUtil') {
            usageData.sendUsageData(
                EventAction.INSTALL_TOOLCHAIN_FROM_NRFUTIL,
                `${version}; ${toolchain?.name}`
            );
            await installNrfUtil(version, dispatch);
        }
    };

const installNrfUtil = async (version: string, dispatch: Dispatch) => {
    await installSdk(version, update => {
        dispatch(addTaskEvent({ version, payload: update }));
    });
};

const installLegacy = async (
    toolchain: Toolchain | undefined,
    dispatch: Dispatch,
    toolchainDir: string,
    version: string,
    justUpdate: boolean
) => {
    try {
        if (toolchain === undefined) throw new Error('No toolchain found');
        await dispatch(ensureCleanTargetDir(toolchainDir));
        await dispatch(installToolchain(version, toolchain, toolchainDir));
        await dispatch(cloneNcs(version, toolchainDir, justUpdate));
    } catch (error) {
        const message = describeError(error);
        dispatch(showErrorDialog(`${message}`));
        usageData.sendErrorReport(`${message}`);
    }
};
