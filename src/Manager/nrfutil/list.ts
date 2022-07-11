/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { persistedInstallDir as installDir } from '../../persistentStore';
import {
    nrfutilSpawnSync,
    stripAndPrintNrfutilLogOutput,
} from './nrfutilChildProcess';

interface InstalledToolchain {
    path: string;
    ncs_version: string;
}

export default () => {
    const tcm = nrfutilSpawnSync(['list', '--install-dir', installDir()]);
    const { data } = JSON.parse(stripAndPrintNrfutilLogOutput(tcm.stdout));
    return data.toolchains as InstalledToolchain[];
};
