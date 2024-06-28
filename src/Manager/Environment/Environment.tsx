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

const Environment = ({ environment }: Props) => {
    const showWarningNCS27 = !!environment.version.match('(2.6.99)|(2.7.\\d+)');

    return (
        <NrfCard>
            <Row noGutters>
                <Col>
                    <div className="tw-flex tw-flex-row tw-items-baseline">
                        <Name environment={environment} />
                        {showWarningNCS27 && (
                            <div className="tw-px-2 tw-text-xs tw-text-amber-700">
                                <span className="mdi mdi-alert tw-text-amber-700" />{' '}
                                Experimental support in VS Code
                            </div>
                        )}
                    </div>

                    <ProgressLabel environment={environment} />
                </Col>
                <Col
                    as={ButtonToolbar}
                    // @ts-expect-error this property exists
                    xs="auto ml-auto"
                    className="d-flex align-items-center wide-btns my-3 pl-3"
                >
                    <ShowFirstSteps environment={environment} />
                    <Install
                        environment={environment}
                        showExperimentalWarning={showWarningNCS27}
                    />
                    <Cancel environment={environment} />
                    <OpenVsCode environment={environment} />
                    <OpenSegger environment={environment} />
                    <EnvironmentMenu environment={environment} />
                </Col>
            </Row>
            <ProgressBar environment={environment} />
        </NrfCard>
    );
};

export default Environment;
