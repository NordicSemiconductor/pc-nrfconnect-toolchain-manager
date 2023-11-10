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
    installDir: string,
    showAll: boolean,
    controller?: AbortController
) => {
    const box = await getToolChainManagerSandbox();
    const args: string[] = ['--install-dir', installDir];

    if (showAll) {
        args.push('--show-all');
    }

    return box.singleInfoOperationOptionalData<ToolchainSearch>(
        'search',
        controller,
        args
    );
};
