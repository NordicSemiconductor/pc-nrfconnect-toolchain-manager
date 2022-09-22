/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { getAppFile, logger } from 'pc-nrfconnect-shared';

const getPlatform = () => {
    if (process.platform === 'darwin' && os.cpus()[0].model.includes('Apple'))
        return 'darwinM1';
    return process.platform;
};

export default () => {
    const executable = getAppFile(
        path.join(
            'resources',
            'nrfutil-toolchain-manager',
            getPlatform(),
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
