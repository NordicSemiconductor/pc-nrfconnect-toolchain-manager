/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Row from 'react-bootstrap/Row';

import { Environment } from '../../state';

import './style.scss';

const Name: FC<{ environment: Environment }> = ({ environment }) => (
    <Row noGutters className="toolchain-item-info h4 mb-0 pt-3">
        nRF Connect SDK {environment.version}
    </Row>
);

export default Name;
