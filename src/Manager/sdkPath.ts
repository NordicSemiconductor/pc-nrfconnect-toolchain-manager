/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';

import { persistedInstallDir } from '../persistentStore';
import config from './ToolchainManager/config';

export default async (version: string, ...params: string[]) =>
    path.resolve(
        persistedInstallDir() ?? (await config()).install_dir,
        version,
        ...params
    );
