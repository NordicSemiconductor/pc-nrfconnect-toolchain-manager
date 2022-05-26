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

import Button from '../Manager/Environment/Button';
import { isInProgress } from '../Manager/Environment/environmentReducer';
import { isAnyToolchainInProgress } from '../Manager/managerSlice';
import { TDispatch } from '../thunk';
import {
    checkOpenVsCodeWithDelay,
    getNrfjprogStatus,
    installExtensions,
    isAppleSilicon,
    NrfjprogStatus,
    openVsCode,
} from './vscode';
import {
    hideVsCodeDialog,
    isDialogVisible,
    setVsCodeStatus,
    VsCodeExtension,
    vsCodeExtensions,
    VsCodeExtensionState,
    VsCodeStatus,
    vsCodeStatus,
} from './vscodeSlice';

import './vscodeDialog.scss';

const VsCodeDialog = () => {
    const dispatch = useDispatch();
    const status = useSelector(vsCodeStatus);
    const extensions = useSelector(vsCodeExtensions);
    const visible = useSelector(isDialogVisible);
    const toolchainInProgress = useSelector(isAnyToolchainInProgress);

    if (!visible) return null;

    const handleClose = () => dispatch(hideVsCodeDialog());

    return (
        <Modal show onHide={handleClose} backdrop="static" size="lg">
            <Modal.Header closeButton={!isInProgress}>
                <Modal.Title data-testid="title">
                    {getTitle(status)}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {status === VsCodeStatus.NOT_CHECKED && (
                    <div className="vscode-dialog-checking-install">
                        <span>
                            Checking if VS Code and dependencies are installed.
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
                                <br />
                                On macOS please make sure to also follow the
                                instructions for{' '}
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line"
                                >
                                    Launching from the command line
                                </a>
                                .
                                {isAppleSilicon && (
                                    <>
                                        <br />
                                        M1-based Mac machines are not currently
                                        supported by our extension so please
                                        install the <b>Intel Chip</b> version.
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
                {status === VsCodeStatus.MISSING_EXTENSIONS && (
                    <ExtensionsMissing extensions={extensions} />
                )}
                {status === VsCodeStatus.MISSING_NRFJPROG && (
                    <>
                        To use the nRF Connect extension for VS Code, you need
                        to&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://www.nordicsemi.com/Products/Development-tools/nRF-Command-Line-Tools/Download#infotabs"
                        >
                            install nRF Command Line Tools
                        </a>
                        &nbsp;and restart nRF Connect for Desktop.
                        {isAppleSilicon && (
                            <>
                                <br />
                                M1-based Mac machines are not currently
                                supported by our extension so please install the{' '}
                                <b>Intel Chip</b> version
                            </>
                        )}
                    </>
                )}
                {status === VsCodeStatus.INSTALL_INTEL && (
                    <>
                        Our extension currently does not support M1 and
                        therefore requires the Intel version of Visual Studio
                        Code.
                        <br />
                        Please&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://code.visualstudio.com/download#"
                        >
                            install the <b>Intel Chip</b> version
                        </a>
                        &nbsp;of Visual Studio Code and restart nRF Connect for
                        Desktop.
                    </>
                )}
                {status === VsCodeStatus.NRFJPROG_INSTALL_INTEL && (
                    <>
                        Our extension currently does not support M1 and
                        therefore requires the Intel version of SEGGER JLink.
                        <br />
                        Please select the <b>Intel Chip</b> version of SEGGER
                        JLink when&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://www.nordicsemi.com/Products/Development-tools/nRF-Command-Line-Tools/Download#infotabs"
                        >
                            installing nRF Command Line Tools
                        </a>
                        &nbsp; and restart nRF Connect for Desktop.
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                {status === VsCodeStatus.MISSING_EXTENSIONS && (
                    <>
                        <MissingExtensionsSkipButton
                            skipText={extensions.some(
                                e => e.state !== VsCodeExtensionState.INSTALLED
                            )}
                            handleClose={handleClose}
                        />
                        {extensions.some(
                            e => e.state !== VsCodeExtensionState.INSTALLED
                        ) && <InstallMissingButton />}
                    </>
                )}
                {(status === VsCodeStatus.INSTALL_INTEL ||
                    status === VsCodeStatus.MISSING_NRFJPROG ||
                    status === VsCodeStatus.NRFJPROG_INSTALL_INTEL) && (
                    <Button
                        icon=""
                        label="Skip"
                        onClick={() => {
                            openVsCode();
                            handleClose();
                        }}
                        variant="secondary"
                    />
                )}
                <CloseButton handleClose={handleClose} />
            </Modal.Footer>
        </Modal>
    );
};

const getTitle = (status: VsCodeStatus) => {
    switch (status) {
        case VsCodeStatus.NOT_CHECKED:
            return 'Opening VS Code';
        case VsCodeStatus.NOT_INSTALLED:
            return 'Install VS Code';
        case VsCodeStatus.INSTALL_INTEL:
            return 'Install Intel version of VS Code';
        case VsCodeStatus.MISSING_EXTENSIONS:
            return 'Install VS Code extensions';
        case VsCodeStatus.MISSING_NRFJPROG:
            return 'Install nRF Command Line Tools';
        case VsCodeStatus.NRFJPROG_INSTALL_INTEL:
            return 'Install Intel version of JLink';
        default:
            return 'VS Code';
    }
};

const CloseButton = ({ handleClose }: { handleClose: () => void }) => (
    <Button icon="" label="Close" onClick={handleClose} variant="secondary" />
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

const MissingExtensionsSkipButton = ({
    skipText,
    handleClose,
}: {
    skipText: boolean;
    handleClose: () => void;
}) => {
    const dispatch = useDispatch<TDispatch>();
    return (
        <Button
            icon=""
            label={skipText ? 'Skip' : 'Open VS Code'}
            onClick={() => {
                if (skipText) {
                    getNrfjprogStatus().then(state => {
                        if (state === NrfjprogStatus.NOT_INSTALLED)
                            dispatch(
                                setVsCodeStatus(VsCodeStatus.MISSING_NRFJPROG)
                            );
                        else if (state === NrfjprogStatus.M1_VERSION)
                            dispatch(
                                setVsCodeStatus(
                                    VsCodeStatus.NRFJPROG_INSTALL_INTEL
                                )
                            );
                        else {
                            handleClose();
                            openVsCode();
                        }
                    });
                } else dispatch(checkOpenVsCodeWithDelay());
            }}
            variant={skipText ? 'secondary' : 'primary'}
        />
    );
};

const ExtensionStateIcon = (state: VsCodeExtensionState) => {
    switch (state) {
        case VsCodeExtensionState.NOT_INSTALLED:
            return (
                <span
                    className="mdi mdi-check-circle extension-not-installed"
                    data-testid="extension-not-installed"
                />
            );
        case VsCodeExtensionState.FAILED:
            return (
                <span
                    className="mdi mdi-alert"
                    data-testid="extension-failed"
                />
            );

        case VsCodeExtensionState.INSTALLED:
            return (
                <span
                    className="mdi mdi-check-circle extension-installed"
                    data-testid="extension-installed"
                />
            );

        case VsCodeExtensionState.INSTALLING:
            return <Spinner />;
    }
};

const ExtensionItem = ({ extension }: { extension: VsCodeExtension }) => (
    <div className="vscode-dialog-entry">
        {ExtensionStateIcon(extension.state)}
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
                    <ExtensionItem
                        key={extension.identifier}
                        extension={extension}
                    />
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
                    them manually from the{' '}
                    <Alert.Link
                        target="_blank"
                        rel="noreferrer"
                        href="https://marketplace.visualstudio.com/items?itemName=nordic-semiconductor.nrf-connect-extension-pack"
                    >
                        nRF Connect Extension Pack
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
        if (isAppleSilicon) return 'https://code.visualstudio.com/download#';
        return 'https://code.visualstudio.com/docs/setup/mac';
    }
    if (process.platform === 'linux') {
        return 'https://code.visualstudio.com/docs/setup/linux';
    }
};

export default VsCodeDialog;
