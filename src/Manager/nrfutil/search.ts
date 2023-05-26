/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { nrfutilSpawnSync } from './nrfutilChildProcess';

interface ToolchainSearch {
    ncs_versions: string[];
}

export default () =>
    nrfutilSpawnSync<ToolchainSearch>(['search', '--show-all']).ncs_versions;
