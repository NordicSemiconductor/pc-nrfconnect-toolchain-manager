/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';

import { persistedInstallDirOfToolChainDefault } from '../persistentStore';

export default async (version: string, ...params: string[]) =>
    path.resolve(
        await persistedInstallDirOfToolChainDefault(),
        version,
        ...params
    );
