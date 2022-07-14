/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { persistedInstallDir as installDir } from '../../persistentStore';
import { nrfutilSpawnSync } from './nrfutilChildProcess';

interface Toolchains {
    toolchains: InstalledToolchain[];
}

interface InstalledToolchain {
    path: string;
    ncs_version: string;
}

export default () =>
    nrfutilSpawnSync<Toolchains>(['list', '--install-dir', installDir()])
        .toolchains;
