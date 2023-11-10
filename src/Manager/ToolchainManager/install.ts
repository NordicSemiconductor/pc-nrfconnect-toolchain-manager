/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { Progress } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';
import { Task } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/sandboxTypes';

import { getToolChainManagerSandbox } from './common';

interface InstallFinish {
    install_path: string;
}

export default async (
    ncsVersion: string,
    installDir: string,
    options?: {
        keepOldToolchainSelection?: boolean;
        toolchainIndex: string;
        skipCmakeRegistration: boolean;
    },
    onProgress?: (progress: Progress, task?: Task) => void,
    controller?: AbortController
) => {
    const box = await getToolChainManagerSandbox();
    const args: string[] = [
        `--ncs-version`,
        ncsVersion,
        '--install-dir',
        installDir,
    ];

    if (options?.keepOldToolchainSelection) {
        args.push('--keep-old-toolchain-selection');
    }

    if (options?.skipCmakeRegistration) {
        args.push('--skip-cmake-registration');
    }

    if (options?.toolchainIndex) {
        args.push('--toolchain-index');
        args.push(options.toolchainIndex);
    }

    const results = await box.spawnNrfutilSubcommand<InstallFinish>(
        'install',
        args,
        onProgress,
        undefined,
        undefined,
        controller
    );

    const taskEndInstall = results.taskEnd.find(
        t => t.task.name === 'install_toolchain'
    );

    if (taskEndInstall && taskEndInstall.task.data) {
        return taskEndInstall.task.data;
    }

    throw new Error('Failed to install toolchain');
};
