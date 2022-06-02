/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import { useDispatch, useSelector } from 'react-redux';
import { logger, usageData } from 'pc-nrfconnect-shared';

import FirstInstallInstructions from '../FirstInstall/FirstInstallInstructions';
import InstallDirDialog from '../InstallDir/InstallDirDialog';
import InstallPackageDialog from '../InstallPackageDialog/InstallPackageDialog';
import NrfCard from '../NrfCard/NrfCard';
import ReduxConfirmDialog from '../ReduxConfirmDialog/ReduxConfirmDialog';
import { isOlderEnvironmentsHidden } from '../Settings/settingsSlice';
import { Dispatch } from '../state';
import { TDispatch } from '../thunk';
import ToolchainSourceDialog from '../ToolchainSource/ToolchainSourceDialog';
import EventAction from '../usageDataActions';
import {
    getNrfjprogStatus,
    getVsCodeStatus,
    NrfjprogStatus,
} from '../VsCodeDialog/vscode';
import VsCodeDialog from '../VsCodeDialog/VsCodeDialog';
import { VsCodeStatus } from '../VsCodeDialog/vscodeSlice';
import Environment from './Environment/Environment';
import RemoveEnvironmentDialog from './Environment/RemoveEnvironmentDialog';
import initEnvironments from './initEnvironments';
import {
    environmentsByVersion,
    isShowingFirstSteps,
    showInstallPackageDialog,
} from './managerSlice';
import NrfUtilEnvDialog from './nrfutil/NrfUtilDialog';
import PlatformInstructions from './PlatformInstructions';
import { filterEnvironments } from './versionFilter';

const Environments = () => {
    const hideOlderAndPreRelease = useSelector(isOlderEnvironmentsHidden);
    const allEnvironments = useSelector(environmentsByVersion);

    const environments = hideOlderAndPreRelease
        ? filterEnvironments(allEnvironments)
        : allEnvironments;

    if (environments.length === 0) {
        return (
            <NrfCard>
                <p>There are no environments available for installation.</p>
            </NrfCard>
        );
    }

    return (
        <>
            {environments.map(environment => (
                <Environment
                    key={environment.version}
                    environment={environment}
                />
            ))}
        </>
    );
};

export default () => {
    const dispatch = useDispatch<TDispatch>();
    useEffect(() => initApp(dispatch), [dispatch]);
    const showingFirstSteps = useSelector(isShowingFirstSteps);

    if (showingFirstSteps) {
        logger.info('Show first install instructions');
        usageData.sendUsageData(
            EventAction.SHOW_FIRST_INSTALL_INSTRUCTIONS,
            `${process.platform}; ${process.arch}`
        );
        return <FirstInstallInstructions />;
    }

    return (
        <div
            onDragOver={evt => {
                evt.preventDefault();
                const ev = evt;
                ev.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={evt => {
                evt.preventDefault();
                const pkg =
                    evt.dataTransfer.getData('text') ||
                    (evt.dataTransfer.files[0] || {}).path;
                dispatch(showInstallPackageDialog(pkg));
            }}
            className="toolchain-manager-main-window"
        >
            <PlatformInstructions />
            <Environments />
            <ButtonToolbar className="pt-3 flex-row justify-content-end">
                <Button
                    variant="link"
                    className="mdi x-mdi-briefcase-plus-outline pr-0 pt-0"
                    onClick={() => dispatch(showInstallPackageDialog(''))}
                >
                    Install package from other source
                </Button>
            </ButtonToolbar>
            <RemoveEnvironmentDialog />
            <InstallPackageDialog />
            <ToolchainSourceDialog />
            <InstallDirDialog />
            <ReduxConfirmDialog />
            <VsCodeDialog />
            <NrfUtilEnvDialog />
        </div>
    );
};

const initApp = (dispatch: Dispatch) => {
    initEnvironments(dispatch);
    reportVsCodeStatus(dispatch);
};

const nrfjprogStatusToString = (status: NrfjprogStatus) => {
    switch (status) {
        case NrfjprogStatus.NOT_INSTALLED:
            return 'Not installed';
        case NrfjprogStatus.INSTALLED:
            return 'Installed';
        case NrfjprogStatus.M1_VERSION:
            return 'M1 version installed';
    }
};

const reportVsCodeStatus = async (dispatch: Dispatch) => {
    const status = await dispatch(getVsCodeStatus());
    const nrfjprogInstallStatus = await getNrfjprogStatus();
    const statusString = {
        [VsCodeStatus.INSTALLED]: 'VS Code installed',
        [VsCodeStatus.MISSING_EXTENSIONS]: 'Extensions are missing',
        [VsCodeStatus.MISSING_NRFJPROG]: 'nRFjprog is missing',
        [VsCodeStatus.NOT_CHECKED]: 'Status not checked',
        [VsCodeStatus.NOT_INSTALLED]: 'VS Code not installed',
        [VsCodeStatus.INSTALL_INTEL]: 'VS Code M1 version installed',
        [VsCodeStatus.NRFJPROG_INSTALL_INTEL]: 'nRFjprog M1 version installed',
    }[status];

    usageData.sendUsageData(EventAction.VS_INSTALLED, statusString);
    usageData.sendUsageData(
        EventAction.NRFJPROG_INSTALLED,
        nrfjprogStatusToString(nrfjprogInstallStatus)
    );
};
