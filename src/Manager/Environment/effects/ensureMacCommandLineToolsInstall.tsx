/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawnSync } from 'child_process';
import { logger } from 'pc-nrfconnect-shared';

export default () => {
    if (process.platform !== 'darwin') return true;

    const tcm = spawnSync('xcode-select', ['-p'], {
        encoding: 'utf8',
    });

    logger.info(
        'Checking installation of XCode Command Line Tools: ',
        tcm.stdout
    );
    if (tcm.status === 0) return true;

    return false;
};
