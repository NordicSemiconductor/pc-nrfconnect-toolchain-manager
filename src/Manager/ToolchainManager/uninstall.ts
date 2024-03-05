/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    getModule,
    Progress,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

export default async (
    ncsVersion: string,
    installDir?: string,
    onProgress?: (progress: Progress) => void,
    controller?: AbortController
) => {
    const box = await getModule('toolchain-manager');
    const args: string[] = [`--ncs-version`, ncsVersion];

    if (installDir) {
        args.push('--install-dir');
        args.push(installDir);
    }

    await box.spawnNrfutilSubcommand(
        'uninstall',
        args,
        onProgress,
        undefined,
        undefined,
        controller
    );
};
