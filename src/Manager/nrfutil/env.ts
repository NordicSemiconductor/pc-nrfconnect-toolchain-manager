/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { persistedInstallDir as installDir } from '../../persistentStore';
import { nrfutilExecSync } from './nrfutilChildProcess';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const getEnvAsScript = (version: string) =>
    nrfutilExecSync(
        `"${nrfutilToolchainManager()}" env --ncs-version "${version}" --install-dir "${installDir()}" --as-script`
    );
