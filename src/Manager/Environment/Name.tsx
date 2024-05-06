/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Row from 'react-bootstrap/Row';
import { execSync } from 'child_process';
import path from 'path';

import { checkExecArchitecture, isAppleSilicon } from '../../helpers';
import { Environment } from '../../state';

import './style.scss';

const Name: FC<{ environment: Environment }> = ({ environment }) => {
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
            arch = 'unknown';
        }
    }
    return (
        <Row noGutters className="toolchain-item-info h4 mb-0 pt-3">
            nRF Connect SDK {environment.version} {arch ? `(${arch})` : ''}
        </Row>
    );
};

export default Name;
