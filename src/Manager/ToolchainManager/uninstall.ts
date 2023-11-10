/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { Progress } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

import { getToolChainManagerSandbox } from './common';

export default async (
    ncsVersion: string,
    installDir: string,
    onProgress?: (progress: Progress) => void,
    controller?: AbortController
) => {
    const box = await getToolChainManagerSandbox();
    const args: string[] = [
        `--ncs-version`,
        ncsVersion,
        '--install-dir',
        installDir,
    ];

    await box.spawnNrfutilSubcommand(
        'uninstall',
        args,
        onProgress,
        undefined,
        undefined,
        controller
    );
};
