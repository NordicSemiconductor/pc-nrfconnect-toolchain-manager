/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    DialogButton,
    ExternalLink,
    GenericDialog,
    openUrl,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { showConfirmInstallDirDialog } from '../../InstallDir/installDirSlice';
import { Environment } from '../../state';
import { isAnyToolchainInProgress } from '../managerSlice';
import Button from './Button';
import { install } from './effects/installEnvironment';
import { isOnlyAvailable, version } from './environmentReducer';

type Props = { environment: Environment; showExperimentalWarning: boolean };

const Install = ({ environment, showExperimentalWarning }: Props) => {
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
                title="Experimental Toolchain and SDK"
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
                            How use VS Code pre-release
                        </DialogButton>
                        <DialogButton
                            onClick={() => setShowExperimentalDialog(false)}
                        >
                            Cancel
                        </DialogButton>
                    </>
                }
            >
                Support for nRF Connect SDK {environment.version} in nRF Connect
                for VS Code is experimental. VS Code users that need{' '}
                {environment.version} should use the preview version of the
                extension, please refer to{' '}
                <ExternalLink
                    label="NCS highlights"
                    href="https://docs.nordicsemi.com/bundle/ncs-2.7.0/page/nrf/releases_and_maturity/releases/release-notes-2.7.0.html#highlights"
                />{' '}
                for details.
            </GenericDialog>
            <Button
                icon="x-mdi-briefcase-download-outline"
                onClick={() => {
                    if (showExperimentalWarning) {
                        setShowExperimentalDialog(true);
                    } else {
                        onClick();
                    }
                }}
                label="Install"
                variant="secondary"
                disabled={anyInProgress}
            />
        </>
    );
};

export default Install;
