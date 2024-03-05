/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getModule } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

interface Config {
    install_dir: string;
}

export default async (controller?: AbortController) => {
    const box = await getModule('toolchain-manager');
    const args: string[] = [`--show`];

    return box.singleInfoOperationOptionalData<Config>(
        'config',
        controller,
        args
    );
};
