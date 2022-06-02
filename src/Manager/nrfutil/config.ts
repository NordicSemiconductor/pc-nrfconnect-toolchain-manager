/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawnSync } from 'child_process';

import nrfutilToolchainManager from './nrfutilToolchainManager';

interface Config {
    current_toolchain: null | {
        data: string;
        type: string;
    };
    install_dir: string;
    toolchain_index_url_override: null | string;
}

const config = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'config'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);

    return data as Config;
};

export default config;
