/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import { nrfutilExec } from './nrfutilChildProcess';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const launchWinBash = (version: string) => {
    nrfutilExec(
        `"${nrfutilToolchainManager()}" launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" cmd.exe /k start bash.exe`,
        {
            ZEPHYR_BASE: [sdkPath(version, 'zephyr')],
        }
    );
};

export const launchTerminal = (version: string) => {
    nrfutilExec(
        `"${nrfutilToolchainManager()}" launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" --terminal`,
        {
            ZEPHYR_BASE: [sdkPath(version, 'zephyr')],
        }
    );
};

export const launchGnomeTerminal = (version: string) => {
    nrfutilExec(
        `gnome-terminal -- "${nrfutilToolchainManager()}" launch --chdir "${sdkPath(
            version
        )}" --ncs-version "${version}" --install-dir "${installDir()}" --shell`,
        {
            ZEPHYR_BASE: [sdkPath(version, 'zephyr')],
        }
    );
};
