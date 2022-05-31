/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { existsSync } from 'fs';
import path from 'path';
import { getAppFile, logger } from 'pc-nrfconnect-shared';

export default () => {
    const executable = getAppFile(
        path.join(
            'resources',
            'nrfutil-toolchain-manager',
            process.platform,
            'nrfutil-toolchain-manager.exe'
        )
    );

    if (executable == null || !existsSync(executable)) {
        const message = `No executable '${executable}' found.`;

        logger.error(message);
        throw new Error(message);
    }

    return executable;
};
