/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';

import { persistedInstallDir } from '../persistentStore';
import { isLegacyEnvironment } from './Environment/environmentReducer';

// nrfutil toolchains have the dir in the environment object and get it from nrfutil
export default (version: string, ...params: string[]) =>
    isLegacyEnvironment(version)
        ? path.resolve(persistedInstallDir(), version, 'toolchain', ...params)
        : '';
