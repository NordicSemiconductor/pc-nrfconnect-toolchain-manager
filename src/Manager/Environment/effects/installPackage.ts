/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import path from 'path';
import {
    describeError,
    ErrorDialogActions,
    usageData,
} from 'pc-nrfconnect-shared';

import { persistedInstallDir as installDir } from '../../../persistentStore';
import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import { addLocallyExistingEnvironment } from '../../managerSlice';
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
    (urlOrFilePath: string) => async (dispatch: Dispatch) => {
        usageData.sendUsageData(
            EventAction.INSTALL_TOOLCHAIN_FROM_PATH,
            `${urlOrFilePath}`
        );
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
            const toolchainDir = path.resolve(
                installDir(),
                version,
                'toolchain'
            );

            await dispatch(ensureCleanTargetDir(toolchainDir));

            fse.mkdirpSync(toolchainDir);

            dispatch(
                addLocallyExistingEnvironment({
                    type: 'legacy',
                    version,
                    toolchainDir,
                    isInstalled: false,
                    isWestPresent: false,
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
            await dispatch(cloneNcs(version, toolchainDir, false));
        } catch (error) {
            const message = describeError(error);
            dispatch(ErrorDialogActions.showDialog(`${message}`));
            usageData.sendErrorReport(`${message}`);
        }
    };
