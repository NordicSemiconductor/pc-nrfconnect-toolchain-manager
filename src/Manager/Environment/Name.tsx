/*
 * Copyright (c) 2024 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { execSync } from 'child_process';
import path from 'path';

import { checkExecArchitecture, isAppleSilicon } from '../../helpers';
import { Environment } from '../../state';

import './style.scss';

export const generateNameFromEnvironment = (environment: Environment) =>
    `nRF Connect SDK ${environment.version}`;

export const generateArchFromEnvironment = (environment: Environment) => {
    let arch = '';
    if (isAppleSilicon && environment.isInstalled) {
        try {
            const toolchain = execSync(
                `file $(find  ${path.join(
                    environment.toolchainDir,
                    'Cellar',
                    'ninja'
                )} -type f -name ninja)`
            );

            arch = checkExecArchitecture(toolchain.toString());
        } catch {
            arch = 'unknown architecture';
        }
    }
    return arch;
};
