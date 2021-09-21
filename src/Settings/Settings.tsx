/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
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
    isOlderEnvironmentsHidden,
    isVsCodeVisible,
    showOlderEnvironments,
    showVsCode,
} from './settingsSlice';

export default () => {
    const dispatch = useDispatch();
    const installDir = useSelector(currentInstallDir);
    const disabled = process.platform === 'darwin';
    const vsCodeVisible = useSelector(isVsCodeVisible);
    const toolchainUrl = useSelector(toolchainRootUrl);
    const olderEnvironmentsHidden = useSelector(isOlderEnvironmentsHidden);

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
                        <Form.Group controlId="showOlderEnvironments">
                            <div className="d-flex">
                                <Toggle
                                    isToggled={olderEnvironmentsHidden}
                                    labelRight
                                    onToggle={() =>
                                        dispatch(
                                            showOlderEnvironments(
                                                !olderEnvironmentsHidden
                                            )
                                        )
                                    }
                                    label="Show only 3 newest minor versions"
                                />
                            </div>

                            <Form.Text className="text-muted">
                                Hide environments older than 3 minor versions.
                                <br />
                                Hide pre-releases when a corresponding release
                                is official.
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
