/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import type { Toolchain } from '../../state';
import { nrfutilSpawnSync } from './nrfutilChildProcess';

interface ToolchainSearch {
    sdks: InstallableEnvironment[];
}

interface InstallableEnvironment {
    toolchains: Toolchain[];
    version: string;
}

export default () => nrfutilSpawnSync<ToolchainSearch>(['search']).sdks;
