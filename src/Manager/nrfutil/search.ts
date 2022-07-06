/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import type { Toolchain } from '../../state';
import { nrfutilSpawnSync } from './nrfutilChildProcess';

interface ToolchainSearch {
    toolchains: Toolchain[];
    version: string;
}

export default () => {
    const tcm = nrfutilSpawnSync(['--json', 'search']);
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as ToolchainSearch[];
};
