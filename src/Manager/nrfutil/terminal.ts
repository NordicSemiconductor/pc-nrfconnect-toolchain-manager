/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec } from 'child_process';

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const launchWinBash = (version: string) => {
    exec(
        `"${nrfutilToolchainManager()}" launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" cmd.exe /k start bash.exe`,
        {
            ...process.env,
            env: { ZEPHYR_BASE: sdkPath(version, 'zephyr') },
        }
    );
};

export const launchTerminal = (version: string) => {
    exec(
        `"${nrfutilToolchainManager()}" launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" --terminal`,
        {
            ...process.env,
            env: { ZEPHYR_BASE: sdkPath(version, 'zephyr') },
        }
    );
};
