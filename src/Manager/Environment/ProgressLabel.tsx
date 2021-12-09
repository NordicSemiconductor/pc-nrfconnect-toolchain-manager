/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Row from 'react-bootstrap/Row';

import { Environment } from '../../state';
import environmentPropType from './environmentPropType';
import { progressLabel } from './environmentReducer';

type Props = { environment: Environment };
const ProgressLabel = ({ environment }: Props) => (
    <Row noGutters className="text-muted small font-italic">
        {progressLabel(environment)}
    </Row>
);

ProgressLabel.propTypes = { environment: environmentPropType.isRequired };

export default ProgressLabel;
