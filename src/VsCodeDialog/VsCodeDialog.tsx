/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from 'pc-nrfconnect-shared';

import extensionFailed from '../../resources/extension-failed.svg';
import extensionInstalled from '../../resources/extension-installed.svg';
import extensionNotInstalled from '../../resources/extension-not-installed.svg';
import Button from '../Manager/Environment/Button';
import { isInProgress } from '../Manager/Environment/environmentReducer';
import { isAnyToolchainInProgress } from '../Manager/managerSlice';
import { isVsCodeEnabled } from '../Settings/settingsSlice';
import { TDispatch } from '../thunk';
import { getVsCodeStatus, installExtensions, openVsCode } from './vscode';
import {
    isDialogVisible,
    setVsCodeDialogHidden,
    VsCodeExtension,
    vsCodeExtensions,
    VsCodeExtensionState,
    VsCodeStatus,
    vsCodeStatus,
} from './vscodeSlice';

import './vscodeDialog.scss';

export const VsCodeDialog = () => {
    const dispatch = useDispatch();
    const status = useSelector(vsCodeStatus);
    const extensions = useSelector(vsCodeExtensions);
    const enabled = useSelector(isVsCodeEnabled);
    const visible = useSelector(isDialogVisible);
    const toolchainInProgress = useSelector(isAnyToolchainInProgress);

    if (!enabled || !visible) return null;

    const handleClose = () => dispatch(setVsCodeDialogHidden());

    return (
        <Modal show onHide={handleClose} backdrop="static" size="lg">
            <Modal.Header closeButton={!isInProgress}>
                <Modal.Title data-testid="title">
                    <h3>{getTitle(status)}</h3>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {status === VsCodeStatus.NOT_CHECKED && (
                    <div className="vscode-dialog-checking-install">
                        <span>
                            Checking if vscode is available on the system.
                        </span>
                        <Spinner />
                    </div>
                )}
                {status === VsCodeStatus.NOT_INSTALLED && (
                    <>
                        {toolchainInProgress ? (
                            <>
                                While the toolchain is installing we recommend
                                you to{' '}
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href={installLink()}
                                >
                                    install VS Code
                                </a>{' '}
                                and restart nRF Connect for Desktop.
                            </>
                        ) : (
                            <>
                                VS Code was not detected on your system.
                                <br />
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href={installLink()}
                                >
                                    Install VS Code
                                </a>{' '}
                                and restart nRF Connect for Desktop.
                            </>
                        )}
                        {process.platform === 'darwin' && (
                            <>
                                <br />
                                On macOS please make sure that you also follow
                                the instructions for{' '}
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line"
                                >
                                    Launching from the command line
                                </a>
                                .
                            </>
                        )}
                    </>
                )}
                {status === VsCodeStatus.MISSING_EXTENSIONS && (
                    <ExtensionsMissing extensions={extensions} />
                )}
                {status === VsCodeStatus.MISSING_NRFJPROG && (
                    <div className="vscode-dialog-entry">
                        To use the nRF Connect extension for VS Code, you need
                        to&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://www.nordicsemi.com/Products/Development-tools/nRF-Command-Line-Tools/Download#infotabs"
                        >
                            install nRF Command Line Tools
                        </a>
                        .
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                {status === VsCodeStatus.MISSING_EXTENSIONS && (
                    <>
                        <OpenAnywayButton
                            handleClose={handleClose}
                            extensions={extensions}
                        />
                        {extensions.some(
                            e => e.state !== VsCodeExtensionState.INSTALLED
                        ) && <InstallMissingButton />}
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
            return 'Checking for VS Code';
        case VsCodeStatus.NOT_INSTALLED:
            return 'VS Code is not installed';
        case VsCodeStatus.INSTALLED:
            return 'VS Code';
        case VsCodeStatus.MISSING_EXTENSIONS:
            return 'Recommended VS Code extensions';
        case VsCodeStatus.MISSING_NRFJPROG:
            return 'nRF Command Line Tools is not installed';
        default:
            return 'VS Code';
    }
};

const CloseButton = ({ handleClose }: { handleClose: () => void }) => (
    <Button icon="" label="Close" onClick={handleClose} variant="primary" />
);

const InstallMissingButton = () => {
    const dispatch = useDispatch();
    return (
        <Button
            icon=""
            label="Install missing extensions"
            onClick={() => dispatch(installExtensions())}
            variant="primary"
        />
    );
};

const OpenAnywayButton = ({
    handleClose,
    extensions,
}: {
    handleClose: () => void;
    extensions: VsCodeExtension[];
}) => {
    const dispatch = useDispatch<TDispatch>();
    return (
        <Button
            icon=""
            label={
                extensions.every(
                    e => e.state === VsCodeExtensionState.INSTALLED
                )
                    ? 'Open VS Code'
                    : 'Open VS Code anyway'
            }
            onClick={() => {
                dispatch(getVsCodeStatus()).then((s: VsCodeStatus) => {
                    if (s === VsCodeStatus.INSTALLED) {
                        openVsCode();
                        handleClose();
                    }
                });
            }}
            variant="primary"
        />
    );
};

const ExtensionStateIcon = ({ state }: { state: VsCodeExtensionState }) => {
    let src;
    let alt;

    switch (state) {
        case VsCodeExtensionState.NOT_INSTALLED:
            src = extensionNotInstalled;
            alt = 'Not installed';
            break;
        case VsCodeExtensionState.FAILED:
            src = extensionFailed;
            alt = 'Failed to install';
            break;
        case VsCodeExtensionState.INSTALLED:
            src = extensionInstalled;
            alt = 'Installed';
            break;
        case VsCodeExtensionState.INSTALLING:
            return <Spinner />;
    }
    return (
        <img
            src={src}
            alt={alt}
            height="18px"
            width="18px"
            className="extension-state-icon"
        />
    );
};

const ExtensionItem = ({ extension }: { extension: VsCodeExtension }) => (
    <div className="vscode-dialog-entry">
        <ExtensionStateIcon state={extension.state} />{' '}
        {`${extension.name} (${extension.identifier})`}
    </div>
);

const ExtensionsMissing = ({
    extensions,
}: {
    extensions: VsCodeExtension[];
}) => {
    const [showAlert, setShowAlert] = useState(false);
    useEffect(() => {
        if (extensions.some(e => e.state === VsCodeExtensionState.FAILED))
            setShowAlert(true);
        else setShowAlert(false);
    }, [extensions, setShowAlert]);

    return (
        <>
            <p>
                For developing nRF applications with VS Code we recommend using
                the following extensions:
            </p>
            <div className="vscode-dialog-list">
                {extensions.map(extension => (
                    <ExtensionItem extension={extension} />
                ))}
            </div>
            <p>
                Extensions can be individually enabled and disabled in VS Code.
            </p>
            {showAlert && (
                <Alert
                    variant="danger"
                    onClose={() => setShowAlert(false)}
                    dismissible
                >
                    Some extensions failed to install. Please try to install
                    them manually through the{' '}
                    <Alert.Link
                        target="_blank"
                        rel="noreferrer"
                        href="https://code.visualstudio.com/docs/editor/extension-marketplace"
                    >
                        VS Code Extension Marketplace
                    </Alert.Link>
                </Alert>
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
