/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getModule } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

interface Toolchains {
    toolchains: InstalledToolchain[];
}

interface InstalledToolchain {
    path: string;
    ncs_version: string;
}

export default async (installDir?: string, controller?: AbortController) => {
    const box = await getModule('toolchain-manager');
    return box.singleInfoOperationOptionalData<Toolchains>(
        'list',
        controller,
        installDir ? ['--install-dir', installDir] : []
    );
};
