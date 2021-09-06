/* Copyright (c) 2015 - 2020, Nordic Semiconductor ASA
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
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { useDispatch, useSelector } from 'react-redux';
import { Toggle } from 'pc-nrfconnect-shared';

import {
    currentInstallDir,
    showSetInstallDirDialog,
} from '../InstallDir/installDirSlice';
import NrfCard from '../NrfCard/NrfCard';
import {
    showSetToolchainSourceDialog,
    toolchainRootUrl,
} from '../ToolchainSource/toolchainSourceSlice';
import {
    isMasterVisible,
    isVsCodeVisible,
    showMasterEnvironment,
    showVsCode,
} from './settingsSlice';

export default () => {
    const dispatch = useDispatch();
    const installDir = useSelector(currentInstallDir);
    const disabled = process.platform === 'darwin';
    const masterVisible = useSelector(isMasterVisible);
    const vsCodeVisible = useSelector(isVsCodeVisible);
    const toolchainUrl = useSelector(toolchainRootUrl);

    return (
        <div>
            <NrfCard>
                <Row className="settings-info">
                    <Col className="ml-3">
                        <Row className="h4">Installation directory</Row>
                        <Row className="text-muted">{installDir}</Row>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="outline-primary"
                            disabled={disabled}
                            onClick={() => dispatch(showSetInstallDirDialog())}
                        >
                            Select directory
                        </Button>
                    </Col>
                </Row>

                <Row className="settings-info mt-4">
                    <Col>
                        <Form.Group controlId="toggleMaster">
                            <div className="d-flex">
                                <Toggle
                                    isToggled={masterVisible}
                                    labelRight
                                    onToggle={() =>
                                        dispatch(
                                            showMasterEnvironment(
                                                !masterVisible
                                            )
                                        )
                                    }
                                    label="Show unstable (master branch) environment"
                                />
                            </div>
                            <Form.Text className="text-muted">
                                Note that the unstable environment is not
                                regularly updated, and its toolchain is likely
                                not well tested.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="settings-info mt-4">
                    <Col>
                        <Form.Group controlId="toggleVsCode">
                            <div className="d-flex">
                                <Toggle
                                    isToggled={vsCodeVisible}
                                    labelRight
                                    onToggle={() =>
                                        dispatch(showVsCode(!vsCodeVisible))
                                    }
                                    label="Show Vs Code button on environments"
                                />
                            </div>

                            <Form.Text className="text-muted">
                                Experimental feature. Will be released with the
                                new vscode extension.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="settings-info d-none">
                    <Col className="ml-3">
                        <Row className="h4">Toolchain source URL</Row>
                        <Row className="text-muted">{toolchainUrl}</Row>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="outline-primary"
                            onClick={() =>
                                dispatch(showSetToolchainSourceDialog())
                            }
                        >
                            Change
                        </Button>
                    </Col>
                </Row>
            </NrfCard>
        </div>
    );
};
