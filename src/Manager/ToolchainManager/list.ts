/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getToolChainManagerSandbox } from './common';

interface Toolchains {
    toolchains: InstalledToolchain[];
}

interface InstalledToolchain {
    path: string;
    ncs_version: string;
}

export default async (installDir?: string, controller?: AbortController) => {
    const box = await getToolChainManagerSandbox();
    return box.singleInfoOperationOptionalData<Toolchains>(
        'list',
        controller,
        installDir ? ['--install-dir', installDir] : []
    );
};
