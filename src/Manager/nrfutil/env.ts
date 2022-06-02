/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { execSync } from 'child_process';

import { persistedInstallDir as installDir } from '../../persistentStore';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const getEnvAsScript = (version: string) =>
    execSync(
        `"${nrfutilToolchainManager()}" env --ncs-version "${version}" --install-dir "${installDir()}" --as-script`,
        { encoding: 'utf-8' }
    );
