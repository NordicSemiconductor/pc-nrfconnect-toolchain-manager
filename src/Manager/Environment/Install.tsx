/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    DialogButton,
    ExternalLink,
    GenericDialog,
    openUrl,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { showConfirmInstallDirDialog } from '../../InstallDir/installDirSlice';
import { Environment } from '../../state';
import { isAnyToolchainInProgress } from '../managerSlice';
import { install } from './effects/installEnvironment';
import { isOnlyAvailable, version } from './environmentReducer';

const Install = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch();
    const anyInProgress = useSelector(isAnyToolchainInProgress);
    const [showExperimentalDialog, setShowExperimentalDialog] = useState(false);

    const { platform } = process;
    const onClick = () => {
        switch (platform) {
            case 'darwin':
                return dispatch(install(environment, false));
            case 'linux':
                return dispatch(
                    showConfirmInstallDirDialog(version(environment))
                );
            case 'win32':
                return dispatch(
                    showConfirmInstallDirDialog(version(environment))
                );
        }
    };

    return !isOnlyAvailable(environment) ? null : (
        <>
            <GenericDialog
                isVisible={showExperimentalDialog}
                headerIcon="alert"
                title="Support for Toolchain and SDK experimental in VS Code"
                footer={
                    <>
                        <DialogButton
                            variant="danger"
                            onClick={() => {
                                setShowExperimentalDialog(false);
                                onClick();
                            }}
                        >
                            Accept the risks and install
                        </DialogButton>
                        <DialogButton
                            onClick={() => {
                                openUrl(
                                    'https://docs.nordicsemi.com/bundle/nrf-connect-vscode/page/rel_notes_overview.html'
                                );
                            }}
                        >
                            How to use pre-release extensions
                        </DialogButton>
                        <DialogButton
                            onClick={() => setShowExperimentalDialog(false)}
                        >
                            Cancel
                        </DialogButton>
                    </>
                }
            >
                Support for this version in nRF Connect for VS Code is
                experimental. If you need to use this version, use the
                pre-release version of the extension. For more information, see{' '}
                <ExternalLink
                    label="nRF Connect SDK v2.7.0 release highlights"
                    href="https://docs.nordicsemi.com/bundle/ncs-2.7.0/page/nrf/releases_and_maturity/releases/release-notes-2.7.0.html#highlights"
                />
                .
            </GenericDialog>
            <Button
                size="lg"
                onClick={() => {
                    onClick();
                }}
                variant="secondary"
                disabled={anyInProgress}
            >
                Install
            </Button>
        </>
    );
};

export default Install;
