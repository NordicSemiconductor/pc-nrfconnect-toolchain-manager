/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    describeError,
    ErrorDialogActions,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import fse from 'fs-extra';
import path from 'path';

import { getNewAbortController } from '../../../globalAbortControler';
import { persistedInstallDir } from '../../../persistentStore';
import { RootState } from '../../../state';
import EventAction from '../../../usageDataActions';
import { addEnvironment } from '../../managerSlice';
import {
    finishInstallToolchain,
    startInstallToolchain,
} from '../environmentReducer';
import { updateConfigFile } from '../segger';
import { cloneNcs } from './cloneNcs';
import { downloadToolchain } from './downloadToolchain';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { unpack } from './unpack';

export const installPackage =
    (urlOrFilePath: string): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        const installDir = persistedInstallDir();

        if (!installDir) {
            throw new Error(
                'Cannot install toolchain. No install directory is set.'
            );
        }

        usageData.sendUsageData(EventAction.INSTALL_TOOLCHAIN_FROM_PATH, {
            urlOrFilePath,
        });
        const match =
            /ncs-toolchain-(v?.+?)([-_]\d{8}-[^.]+).[zip|dmg|snap]/.exec(
                urlOrFilePath
            );
        if (!match) {
            const errorMsg =
                'Filename is not recognized as a toolchain package.';
            dispatch(ErrorDialogActions.showDialog(errorMsg));
            usageData.sendErrorReport(errorMsg);
            return;
        }

        try {
            const version = match[1];
            const toolchainDir = path.resolve(installDir, version, 'toolchain');

            await dispatch(ensureCleanTargetDir(version, toolchainDir));

            fse.mkdirpSync(toolchainDir);

            dispatch(
                addEnvironment({
                    type: 'legacy',
                    version,
                    toolchainDir,
                    isInstalled: false,
                    isWestPresent: false,
                    toolchains: [],
                })
            );
            dispatch(startInstallToolchain(version));

            const filePath = fse.existsSync(urlOrFilePath)
                ? urlOrFilePath
                : await dispatch(
                      downloadToolchain(version, { uri: urlOrFilePath })
                  );

            await dispatch(unpack(version, filePath, toolchainDir));
            updateConfigFile(toolchainDir);
            dispatch(finishInstallToolchain(version, toolchainDir));
            await dispatch(cloneNcs(version, false, getNewAbortController()));
        } catch (error) {
            const message = describeError(error);
            dispatch(ErrorDialogActions.showDialog(`${message}`));
            usageData.sendErrorReport(`${message}`);
        }
    };
