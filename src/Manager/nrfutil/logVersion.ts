/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AppThunk, logger } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { RootState } from '../../state';
import { nrfutilSpawnSync } from './nrfutilChildProcess';
import { showNrfUtilDialogAction } from './nrfUtilDialogSlice';
import nrfutilToolchainManager from './nrfutilToolchainManager';

interface VersionInformation {
    build_timestamp: string;
    commit_date: string;
    commit_hash: string;
    dependencies: null;
    host: string;
    name: string;
    version: string;
}

export default (): AppThunk<RootState, Promise<void>> => async dispatch => {
    try {
        const version = nrfutilSpawnSync<VersionInformation>(['--version']);

        logger.info(
            `${version.name} ${version.version} (${version.commit_hash} ${version.commit_date})`
        );
    } catch (error) {
        logger.error('Unable to run nrfutil-toolchain-manager');
        dispatch(
            showNrfUtilDialogAction({
                title: 'Unable to run nrfutil-toolchain-manager.exe',
                content:
                    `This will lead to not beeing able to install newer toolchains (v2.0.0 and newer).` +
                    `\n\nPlease verify that you are able to launch **${nrfutilToolchainManager()}** on your system.` +
                    `${
                        process.platform === 'win32'
                            ? '\n\nA known issue is that some systems do not have the vc redistributable (x64) installed. [https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist](https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)'
                            : ''
                    }`,
            })
        );
    }
};
