/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getToolChainManagerSandbox } from './common';

interface Config {
    install_dir: string;
}

export default async (controller?: AbortController) => {
    const box = await getToolChainManagerSandbox();
    const args: string[] = [`--show`];

    return box.singleInfoOperationOptionalData<Config>(
        'config',
        controller,
        args
    );
};
