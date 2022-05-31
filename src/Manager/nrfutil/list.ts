/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawnSync } from 'child_process';

import nrfutilToolchainManager from './nrfutilToolchainManager';

interface InstalledToolchain {
    path: string;
    ncs_version: string;
}

export default () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'list'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.toolchains as InstalledToolchain[];
};
