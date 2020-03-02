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

import './style.scss';

import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import NrfCard from '../../NrfCard/NrfCard';
import {
    cloneNcs,
    confirmInstall,
    openBash,
    openCmd,
    openFolder,
    openToolchainFolder,
    confirmRemove,
    selectEnvironmentAction,
    gotoPage,
} from '../environmentsActions';
import { openSegger } from '../segger';

const PrimaryButton = ({ label, className, ...props }) => (
    <Button className={`${className} toolchain-item-button ml-2`} variant="primary" {...props}>
        {label}
    </Button>
);
PrimaryButton.propTypes = {
    label: PropTypes.string.isRequired,
    className: PropTypes.string,
};
PrimaryButton.defaultProps = { className: '' };

const EnvironmentItem = ({
    environment: {
        toolchainDir,
        version,
        progress,
        isRemoving,
        isCloning,
        isWestPresent,
    },
}) => {
    const dispatch = useDispatch();

    const isInProcess = useSelector(({ app }) => (
        app.manager.environmentList.find(v => v.version === version).isInProcess
    ));

    const isInstalled = !!toolchainDir;

    let progressPct = isRemoving ? 0 : progress;
    progressPct = isInstalled ? 100 : (progressPct || 0);

    let progressLabel = progress ? `Installing ${progress}%` : '';
    progressLabel = isInstalled ? '' : progressLabel;
    progressLabel = isCloning
        ? 'Cloning SDK... please wait until the terminal window is closed!'
        : progressLabel;
    progressLabel = isRemoving ? 'Removing...' : progressLabel;

    let progressClassName = progressPct === 0 ? 'available' : 'installing';
    progressClassName = isInstalled ? 'installed' : progressClassName;
    progressClassName = isCloning ? 'installing' : progressClassName;
    progressClassName = isRemoving ? 'removing' : progressClassName;

    return (
        <NrfCard>
            <Row noGutters>
                <Col>
                    <Row noGutters className="toolchain-item-info h4 mb-0 pt-3">
                        nRF Connect SDK {version}
                    </Row>
                    <Row noGutters className="toolchain-item-info text-muted small font-italic">
                        {progressLabel}
                    </Row>
                </Col>
                <Col
                    as={ButtonToolbar}
                    xs="auto ml-auto"
                    className="d-flex align-items-center my-3 pl-3 wide-btns"
                >
                    { (isInstalled || (isInProcess && !isRemoving)) && (
                        <PrimaryButton
                            className="mdi x-mdi-dog-service"
                            onClick={() => {
                                dispatch(selectEnvironmentAction(version));
                                dispatch(gotoPage(2));
                            }}
                            label="First steps to build"
                            title="Show how to build a sample project"
                            variant="outline-primary"
                        />
                    )}
                    { !isInstalled && (
                        <PrimaryButton
                            className="mdi x-mdi-briefcase-download-outline"
                            onClick={() => dispatch(confirmInstall(version))}
                            label="Install"
                            disabled={isInProcess}
                            variant="outline-primary"
                        />
                    )}
                    { (isInstalled && (isWestPresent && !isRemoving)) && (
                        <PrimaryButton
                            className="mdi x-mdi-rocket"
                            onClick={() => dispatch(openSegger(version))}
                            label="Open IDE"
                            title="Open SEGGER Embedded Studio"
                            disabled={isInProcess}
                        />
                    )}
                    <DropdownButton
                        className="ml-2"
                        variant="outline-primary"
                        title=""
                        alignRight
                        disabled={isInProcess || !isInstalled}
                    >
                        {isInstalled && (
                            <>
                                <Dropdown.Item
                                    title="Open bash terminal"
                                    onClick={() => dispatch(openBash(version))}
                                >
                                    Open bash
                                </Dropdown.Item>
                                <Dropdown.Item
                                    title="Open command prompt"
                                    onClick={() => dispatch(openCmd(version))}
                                >
                                    Open command prompt
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    title="Open SDK folder"
                                    onClick={() => dispatch(openFolder(version))}
                                >
                                    Open SDK folder
                                </Dropdown.Item>
                                <Dropdown.Item
                                    title="Open toolchain folder"
                                    onClick={() => dispatch(openToolchainFolder(version))}
                                >
                                    Open toolchain folder
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    title="Update SDK"
                                    onClick={() => dispatch(cloneNcs(version))}
                                >
                                    Update SDK
                                </Dropdown.Item>
                                <Dropdown.Item
                                    title="Install the latest available toolchain for this environment"
                                    onClick={() => dispatch(confirmInstall(version))}
                                >
                                    Update toolchain
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    title="Remove"
                                    onClick={() => dispatch(confirmRemove(version))}
                                >
                                    Remove
                                </Dropdown.Item>
                            </>
                        )}
                    </DropdownButton>
                </Col>
            </Row>
            <ProgressBar
                now={progressPct}
                striped={!isInstalled || isRemoving || isCloning}
                animated={!isInstalled || isRemoving || isCloning}
                className={progressClassName}
            />
        </NrfCard>
    );
};

EnvironmentItem.propTypes = {
    environment: PropTypes.shape({
        toolchainDir: PropTypes.string,
        version: PropTypes.string.isRequired,
        progress: PropTypes.number,
        isCloning: PropTypes.bool,
        isRemoving: PropTypes.bool,
        isWestPresent: PropTypes.bool,
    }).isRequired,
};
export default EnvironmentItem;
