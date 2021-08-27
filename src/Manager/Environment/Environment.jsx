/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React from 'react';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import NrfCard from '../../NrfCard/NrfCard';
import EnvironmentMenu from './EnvironmentMenu';
import environmentPropType from './environmentPropType';
import Install from './Install';
import Name from './Name';
import OpenIde from './OpenIde';
import OpenVsCode from './OpenVsCode';
import ProgressBar from './ProgressBar';
import ProgressLabel from './ProgressLabel';
import ShowFirstSteps from './ShowFirstSteps';

import './style.scss';

const Environment = ({ environment }) => (
    <NrfCard>
        <Row noGutters>
            <Col>
                <Name environment={environment} />
                <ProgressLabel environment={environment} />
            </Col>
            <Col
                as={ButtonToolbar}
                xs="auto ml-auto"
                className="d-flex align-items-center my-3 pl-3 wide-btns"
            >
                <ShowFirstSteps environment={environment} />
                <Install environment={environment} />
                <OpenIde environment={environment} />
                <OpenVsCode environment={environment} />
                <EnvironmentMenu environment={environment} />
            </Col>
        </Row>
        <ProgressBar environment={environment} />
    </NrfCard>
);

Environment.propTypes = { environment: environmentPropType.isRequired };

export default Environment;
