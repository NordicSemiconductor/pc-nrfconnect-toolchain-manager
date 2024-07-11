/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog,
    DialogButton,
    Spinner,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { isAnyToolchainInProgress } from '../Manager/managerSlice';
import {
    getNrfjprogStatus,
    installExtensions,
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
    const allExtensionsInstalled = !extensions.some(
        extension => extension.state !== VsCodeExtensionState.INSTALLED
    );
    const visible = useSelector(isDialogVisible);
    const toolchainInProgress = useSelector(isAnyToolchainInProgress);

    if (!visible) return null;

    const handleClose = () => dispatch(hideVsCodeDialog());

    return (
        <Dialog isVisible onHide={handleClose} size="lg">
            <Dialog.Header title={getTitle(status)} />
            <Dialog.Body>
                {status === VsCodeStatus.NOT_CHECKED && (
                    <div className="vscode-dialog-checking-install">
                        <span>
                            Checking if VS Code and dependencies are installed.
                        </span>
                        <Spinner size="sm" />
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
                                </a>
                                .
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
                                </a>
                                .
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
                    </>
                )}
                {status === VsCodeStatus.RECOMMEND_UNIVERSAL && (
                    <>
                        For optimal performance we recommend you to&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://code.visualstudio.com/download#"
                        >
                            install the <b>Universal</b> version
                        </a>
                        &nbsp;of Visual Studio Code. After that, restart nRF
                        Connect for Desktop to complete the installation.
                    </>
                )}
                {status === VsCodeStatus.NRFJPROG_RECOMMEND_UNIVERSAL && (
                    <>
                        For optimal performance we recommend you to install the{' '}
                        <b>Universal</b> version of SEGGER JLink when&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://www.nordicsemi.com/Products/Development-tools/nRF-Command-Line-Tools/Download#infotabs"
                        >
                            installing nRF Command Line Tools
                        </a>
                        . After that, restart nRF Connect for Desktop to
                        complete the installation.
                    </>
                )}
            </Dialog.Body>
            <Dialog.Footer>
                {status === VsCodeStatus.NOT_INSTALLED && (
                    <DialogButton variant="primary" onClick={() => {}}>
                        Retry
                    </DialogButton>
                )}
                {status === VsCodeStatus.MISSING_EXTENSIONS && (
                    <>
                        {allExtensionsInstalled && (
                            <DialogButton
                                variant="primary"
                                onClick={() => {
                                    dispatch(openVsCode());
                                }}
                            >
                                Open VS Code
                            </DialogButton>
                        )}
                        {!allExtensionsInstalled && (
                            <>
                                <MissingExtensionsSkipButton />
                                <InstallMissingButton />
                            </>
                        )}
                    </>
                )}
                {(status === VsCodeStatus.RECOMMEND_UNIVERSAL ||
                    status === VsCodeStatus.MISSING_NRFJPROG ||
                    status === VsCodeStatus.NRFJPROG_RECOMMEND_UNIVERSAL) && (
                    <DialogButton
                        onClick={() => {
                            dispatch(openVsCode(true));
                        }}
                        variant="secondary"
                    >
                        Skip
                    </DialogButton>
                )}
                <CloseButton handleClose={handleClose} />
            </Dialog.Footer>
        </Dialog>
    );
};

const getTitle = (status: VsCodeStatus) => {
    switch (status) {
        case VsCodeStatus.NOT_CHECKED:
            return 'Opening VS Code';
        case VsCodeStatus.NOT_INSTALLED:
            return 'Install VS Code';
        case VsCodeStatus.RECOMMEND_UNIVERSAL:
            return 'Install Universal version of VS Code';
        case VsCodeStatus.MISSING_EXTENSIONS:
            return 'Install VS Code extensions';
        case VsCodeStatus.MISSING_NRFJPROG:
            return 'Install nRF Command Line Tools';
        case VsCodeStatus.NRFJPROG_RECOMMEND_UNIVERSAL:
            return 'Install Universal version of JLink';
        default:
            return 'VS Code';
    }
};

const CloseButton = ({ handleClose }: { handleClose: () => void }) => (
    <DialogButton onClick={handleClose} variant="secondary">
        Close
    </DialogButton>
);

const InstallMissingButton = () => {
    const dispatch = useDispatch();
    return (
        <DialogButton
            onClick={() => dispatch(installExtensions())}
            variant="primary"
        >
            Install missing extensions
        </DialogButton>
    );
};

const MissingExtensionsSkipButton = () => {
    const dispatch = useDispatch();
    return (
        <DialogButton
            onClick={() => {
                getNrfjprogStatus().then(state => {
                    if (state === NrfjprogStatus.NOT_INSTALLED)
                        dispatch(
                            setVsCodeStatus(VsCodeStatus.MISSING_NRFJPROG)
                        );
                    else if (state === NrfjprogStatus.RECOMMEND_UNIVERSAL)
                        dispatch(
                            setVsCodeStatus(
                                VsCodeStatus.NRFJPROG_RECOMMEND_UNIVERSAL
                            )
                        );
                    else {
                        dispatch(openVsCode(true));
                    }
                });
            }}
            variant="secondary"
        >
            Skip
        </DialogButton>
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
            return <Spinner size="sm" className="tw-ml-0.5 tw-mr-1.5" />;
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
        return 'https://code.visualstudio.com/docs/setup/mac';
    }
    if (process.platform === 'linux') {
        return 'https://code.visualstudio.com/docs/setup/linux';
    }
};

export default VsCodeDialog;
