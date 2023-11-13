/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import path from 'path';

import { persistedInstallDir } from '../persistentStore';
import { isLegacyEnvironment } from './Environment/environmentReducer';
import toolchainManager from './ToolchainManager/toolchainManager';

// nrfutil toolchains have the dir in the environment object and get it from nrfutil
export default async (version: string, ...params: string[]) =>
    isLegacyEnvironment(version)
        ? path.resolve(
              persistedInstallDir() ??
                  (await toolchainManager.config()).install_dir,
              version,
              'toolchain',
              ...params
          )
        : '';
