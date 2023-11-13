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
import { Toggle } from '@nordicsemiconductor/pc-nrfconnect-shared';

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
    showOlderEnvironments,
} from './settingsSlice';

export default () => {
    const dispatch = useDispatch();
    const installDir = useSelector(currentInstallDir);
    const disabled = process.platform === 'darwin';
    const toolchainUrl = useSelector(toolchainRootUrl);
    const olderEnvironmentsHidden = useSelector(isOlderEnvironmentsHidden);

    return (
        <div className="toolchain-manager-main-window">
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
                                    onToggle={() =>
                                        dispatch(
                                            showOlderEnvironments(
                                                !olderEnvironmentsHidden
                                            )
                                        )
                                    }
                                    isToggled={olderEnvironmentsHidden}
                                    labelRight
                                    label="Show only 3 newest minor versions"
                                    variant="primary"
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
