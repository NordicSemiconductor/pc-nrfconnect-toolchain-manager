/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';

import { persistedInstallDir as installDir } from '../persistentStore';

export default (version: string, ...params: string[]) =>
    path.resolve(installDir(), version, ...params);
