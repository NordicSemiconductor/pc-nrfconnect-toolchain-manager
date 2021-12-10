/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import { describeError, usageData } from 'pc-nrfconnect-shared';

import showErrorDialog from '../../../launcherActions';
import { Dispatch, Toolchain } from '../../../state';
import {
    finishInstallToolchain,
    startInstallToolchain,
} from '../environmentReducer';
import { updateConfigFile } from '../segger';
import { downloadToolchain } from './downloadToolchain';
import { unpack } from './unpack';

// eslint-disable-next-line import/prefer-default-export
export const installToolchain =
    (version: string, toolchain: Toolchain, toolchainDir: string) =>
    async (dispatch: Dispatch) => {
        dispatch(startInstallToolchain(version));

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

        dispatch(finishInstallToolchain(version, toolchainDir));
    };
