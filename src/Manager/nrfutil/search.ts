/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import type { Toolchain } from '../../state';
import {
    nrfutilSpawnSync,
    stripAndPrintNrfutilLogOutput,
} from './nrfutilChildProcess';

interface ToolchainSearch {
    toolchains: Toolchain[];
    version: string;
}

export default () => {
    const tcm = nrfutilSpawnSync(['search']);
    const { data } = JSON.parse(stripAndPrintNrfutilLogOutput(tcm.stdout));
    return data.sdks as ToolchainSearch[];
};
