/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { useDispatch, useSelector } from 'react-redux';

import extensionFailed from '../../resources/extension-failed.svg';
import extensionInstalled from '../../resources/extension-installed.svg';
import extensionNotInstalled from '../../resources/extension-not-installed.svg';
import Button from '../Manager/Environment/Button';
import { isInProgress } from '../Manager/Environment/environmentReducer';
import { isVsCodeEnabled } from '../Settings/settingsSlice';
import { installExtensions, openVsCode, VsCodeStatus } from './vscode';
import {
    deselectExtension,
    getToolchainDir,
    hideVsCodeDialog,
    isDialogVisible,
    nrfjprogInstalled,
    selectExtension,
    VsCodeExtension,
    vsCodeExtensions,
    VsCodeExtensionState,
    vsCodeStatus,
} from './vscodeSlice';

export const VsCodeDialog = () => {
    const dispatch = useDispatch();
    const status = useSelector(vsCodeStatus);
    const extensions = useSelector(vsCodeExtensions);
    const nrfjprog = useSelector(nrfjprogInstalled);
    const enabled = useSelector(isVsCodeEnabled);
    const visible = useSelector(isDialogVisible);
    const toolchainDir = useSelector(getToolchainDir);

    if (!enabled || !visible) return null;

    const handleClose = () => dispatch(hideVsCodeDialog());

    return (
        <Modal show onHide={handleClose} backdrop="static" size="lg">
            <Modal.Header closeButton={!isInProgress}>
                <Modal.Title data-testid="title">
                    <h3>{getTitle(status)}</h3>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {status === VsCodeStatus.NOT_CHECKED &&
                    'Checking if vscode is available on the system.'}
                {status === VsCodeStatus.NOT_INSTALLED && (
                    <>
                        {!toolchainDir ? (
                            <>
                                While the toolchain is installing, we recommend
                                you to{' '}
                                <a href={installLink()}>install VS Code</a>.
                            </>
                        ) : (
                            <>
                                VS Code was not detected on your system.
                                <br />
                                <a href={installLink()}>Install VS Code</a> and
                                try again.
                            </>
                        )}

                        {process.platform === 'darwin' && (
                            <>
                                <br />
                                On macOS please make sure that you also follow
                                the instructions for{' '}
                                <a href="https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line">
                                    Launching from the command line
                                </a>
                                .
                            </>
                        )}
                    </>
                )}
                {status === VsCodeStatus.MISSING_TOOLS && (
                    <ExtensionsMissing
                        extensions={extensions}
                        nrfjprog={nrfjprog}
                        toolchainDir={toolchainDir}
                    />
                )}
            </Modal.Body>
            <Modal.Footer>
                {status === VsCodeStatus.MISSING_TOOLS && (
                    <>
                        {toolchainDir && (
                            <OpenAnywayButton
                                handleClose={handleClose}
                                toolchainDir={toolchainDir}
                                extensions={extensions}
                                nrfjprog={nrfjprog}
                            />
                        )}
                        <InstallMissingButton
                            disabled={
                                !extensions.some(
                                    e =>
                                        e.selected &&
                                        e.state !==
                                            VsCodeExtensionState.INSTALLED
                                )
                            }
                        />
                    </>
                )}
                <CloseButton handleClose={handleClose} />
            </Modal.Footer>
        </Modal>
    );
};

const getTitle = (status: VsCodeStatus) => {
    switch (status) {
        case VsCodeStatus.NOT_CHECKED:
            return 'Checking for Vs Code';
        case VsCodeStatus.NOT_INSTALLED:
            return 'Vs Code is not installed';
        case VsCodeStatus.INSTALLED:
            return 'Vs Code';
        case VsCodeStatus.MISSING_TOOLS:
            return 'Missing Vs Code extensions';
        default:
            return 'Vs Code';
    }
};

const CloseButton = ({ handleClose }: { handleClose: () => void }) => (
    <Button icon="" label="Close" onClick={handleClose} variant="primary" />
);

const InstallMissingButton = ({ disabled }: { disabled: boolean }) => {
    const dispatch = useDispatch();
    return (
        <Button
            icon=""
            label="Install selected extensions"
            onClick={() => dispatch(installExtensions())}
            variant="primary"
            disabled={disabled}
        />
    );
};

const OpenAnywayButton = ({
    handleClose,
    toolchainDir,
    extensions,
    nrfjprog,
}: {
    handleClose: () => void;
    toolchainDir?: string;
    extensions: VsCodeExtension[];
    nrfjprog: boolean;
}) => (
    <Button
        icon=""
        label={
            extensions.every(e =>
                e.required ? e.state === VsCodeExtensionState.INSTALLED : true
            ) && nrfjprog
                ? 'Open VS Code'
                : 'Open VS Code anyway'
        }
        onClick={() => {
            if (toolchainDir) openVsCode(toolchainDir);
            handleClose();
        }}
        variant="primary"
    />
);

const ExtensionCheck = ({ extension }: { extension: VsCodeExtension }) => {
    const dispatch = useDispatch();
    return (
        <>
            <br />
            <Form.Check
                inline
                type="checkbox"
                label={`${extension.name} (${extension.identifier})`}
                defaultChecked={
                    extension.state !== VsCodeExtensionState.INSTALLED
                }
                disabled={extension.state === VsCodeExtensionState.INSTALLED}
                onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                    if (evt.target.checked)
                        dispatch(selectExtension(extension.identifier));
                    else dispatch(deselectExtension(extension.identifier));
                }}
            />
            {extension.state === VsCodeExtensionState.INSTALLED && (
                <img
                    src={extensionInstalled}
                    alt="Installed"
                    height="18px"
                    width="18px"
                />
            )}
            {extension.state === VsCodeExtensionState.NOT_INSTALLED && (
                <img
                    src={extensionNotInstalled}
                    alt="Not installed"
                    height="18px"
                    width="18px"
                />
            )}
            {extension.state === VsCodeExtensionState.INSTALLING && (
                <Spinner animation="border" role="status" size="sm" />
            )}
            {extension.state === VsCodeExtensionState.FAILED && (
                <img
                    src={extensionFailed}
                    alt="Failed to install"
                    height="18px"
                    width="18px"
                />
            )}
        </>
    );
};

const ExtensionsMissing = ({
    extensions,
    nrfjprog,
    toolchainDir,
}: {
    extensions: VsCodeExtension[];
    nrfjprog: boolean;
    toolchainDir?: string;
}) => {
    const required = extensions.filter(e => e.required);
    const recommended = extensions.filter(e => !e.required);

    const failedInstall = extensions.some(
        e => e.state === VsCodeExtensionState.FAILED
    );

    return (
        <>
            {!toolchainDir ? (
                <>
                    While the toolchain is installing, we recommend you to
                    install the following Vs Code extensions:{' '}
                </>
            ) : (
                <>
                    For developing nRF applications with VS Code we recommend
                    using the following extensions:
                </>
            )}
            <br />
            <strong>Required</strong>
            {required.map(extension => (
                <ExtensionCheck extension={extension} />
            ))}
            {!nrfjprog && (
                <>
                    <br />
                    To use the nRF Connect extension for VS Code, you need to{' '}
                    <a href="https://www.nordicsemi.com/Products/Development-tools/nRF-Command-Line-Tools">
                        install nRF Command Line Tools
                    </a>{' '}
                    <img
                        src={extensionNotInstalled}
                        alt="Not installed"
                        height="18px"
                        width="18px"
                    />
                </>
            )}
            <br />
            <strong>Recommended</strong>
            {recommended.map(extension => (
                <ExtensionCheck extension={extension} />
            ))}
            {failedInstall && (
                <>
                    <br />
                    <i>
                        Some extensions failed to install. Please try to install
                        them manually through the{' '}
                        <a href="https://code.visualstudio.com/docs/editor/extension-marketplace">
                            VS Code Extension Marketplace
                        </a>
                    </i>
                </>
            )}
        </>
    );
};

const installLink = () => {
    if (process.platform === 'win32') {
        return 'https://code.visualstudio.com/docs/setup/windows';
    }
    if (process.platform === 'darwin') {
        return 'https://code.visualstudio.com/docs/setup/mac';
    }
    if (process.platform === 'linux') {
        return 'https://code.visualstudio.com/docs/setup/linux';
    }
};

export default VsCodeDialog;
