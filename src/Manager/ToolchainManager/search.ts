/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getToolChainManagerSandbox } from './common';

interface ToolchainSearch {
    ncs_versions: string[];
}

export default async (
    showAll: boolean,
    installDir?: string,
    controller?: AbortController
) => {
    const box = await getToolChainManagerSandbox();
    const args: string[] = [];

    if (installDir) {
        args.push('--install-dir');
        args.push(installDir);
    }

    if (showAll) {
        args.push('--show-all');
    }

    return box.singleInfoOperationOptionalData<ToolchainSearch>(
        'search',
        controller,
        args
    );
};
