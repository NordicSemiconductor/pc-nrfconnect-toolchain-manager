/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';

import { persistedInstallDir } from '../persistentStore';
import { isLegacyEnvironment } from './Environment/environmentReducer';

// The nrfutil environments should use nrfutil to get the toolchain path as soon as that feature exists.
export default (version: string, ...params: string[]) =>
    isLegacyEnvironment(version)
        ? path.resolve(persistedInstallDir(), version, 'toolchain', ...params)
        : path.resolve(persistedInstallDir(), 'toolchains', version, ...params);
