/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { nrfutilSpawnSync } from './nrfutilChildProcess';

interface Config {
    current_toolchain: null | {
        data: string;
        type: string;
    };
    install_dir: string;
    toolchain_index_url_override: null | string;
}

const config = () => {
    const tcm = nrfutilSpawnSync(['--json', 'config']);
    const { data } = JSON.parse(tcm.stdout);

    return data as Config;
};

export default config;
