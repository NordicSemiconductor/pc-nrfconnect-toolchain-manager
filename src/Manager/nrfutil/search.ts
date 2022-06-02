/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawnSync } from 'child_process';

import type { Toolchain } from '../../state';
import nrfutilToolchainManager from './nrfutilToolchainManager';

interface ToolchainSearch {
    toolchains: Toolchain[];
    version: string;
}

export default () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'search'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as ToolchainSearch[];
};
