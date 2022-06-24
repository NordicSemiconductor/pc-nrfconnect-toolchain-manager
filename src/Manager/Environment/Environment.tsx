/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import NrfCard from '../../NrfCard/NrfCard';
import { Environment as Model } from '../../state';
import Cancel from './Cancel';
import EnvironmentMenu from './EnvironmentMenu';
import Install from './Install';
import Name from './Name';
import OpenSegger from './OpenSegger';
import { OpenVsCode } from './OpenVsCode';
import ProgressBar from './ProgressBar';
import ProgressLabel from './ProgressLabel';
import ShowFirstSteps from './ShowFirstSteps';

import './style.scss';

type Props = { environment: Model };

const Environment = ({ environment }: Props) => (
    <NrfCard>
        <Row noGutters>
            <Col>
                <Name environment={environment} />
                <ProgressLabel environment={environment} />
            </Col>
            <Col
                as={ButtonToolbar}
                // @ts-expect-error this property exists
                xs="auto ml-auto"
                className="d-flex align-items-center my-3 pl-3 wide-btns"
            >
                <ShowFirstSteps environment={environment} />
                <Install environment={environment} />
                <Cancel environment={environment} />
                <OpenVsCode environment={environment} />
                <OpenSegger environment={environment} />
                <EnvironmentMenu environment={environment} />
            </Col>
        </Row>
        <ProgressBar environment={environment} />
    </NrfCard>
);

export default Environment;
