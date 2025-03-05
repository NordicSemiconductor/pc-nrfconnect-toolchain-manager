/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    AppThunk,
    isDevelopment,
    isLoggingVerbose,
    logger,
    Spinner,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { webUtils } from 'electron';
import semver from 'semver';

import FirstInstallInstructions from '../FirstInstall/FirstInstallInstructions';
import InstallDirDialog from '../InstallDir/InstallDirDialog';
import {
    currentInstallDir,
    setInstallDir,
} from '../InstallDir/installDirSlice';
import InstallPackageDialog from '../InstallPackageDialog/InstallPackageDialog';
import {
    persistedInstallDirOfToolChainDefault as persistedInstallDirOrToolChainDefault,
    setPersistedInstallDir,
} from '../persistentStore';
import ReduxConfirmDialog from '../ReduxConfirmDialog/ReduxConfirmDialog';
import {
    arePreReleaseShown,
    isOlderEnvironmentsHidden,
} from '../Settings/settingsSlice';
import { RootState } from '../state';
import ToolchainSourceDialog from '../ToolchainSource/ToolchainSourceDialog';
import EventAction from '../usageDataActions';
import {
    getNrfjprogStatus,
    getVsCodeStatus,
    NrfjprogStatus,
} from '../VsCodeDialog/vscode';
import VsCodeDialog from '../VsCodeDialog/VsCodeDialog';
import { VsCodeStatus } from '../VsCodeDialog/vscodeSlice';
import detectMultipleInstallDirs from './detectMultipleInstallDirs';
import Environment from './Environment/Environment';
import RemoveEnvironmentDialog from './Environment/RemoveEnvironmentDialog';
import EnvironmentGuide from './EnvironmentGuide/EnvironmentGuide';
import initEnvironments from './initEnvironments';
import {
    environmentsByVersion,
    isEnvironmentsListInitialized,
    isShowingFirstSteps,
    showInstallPackageDialog,
} from './managerSlice';
import NrfUtilEnvDialog from './nrfutil/NrfUtilDialog';
import PlatformInstructions from './PlatformInstructions';
import toolchainManager from './ToolchainManager/toolchainManager';
import { filterEnvironments } from './versionFilter';

const Environments = () => {
    const hideOlderAndPreRelease = useSelector(isOlderEnvironmentsHidden);
    const showPreReleases = useSelector(arePreReleaseShown);
    const allEnvironments = useSelector(environmentsByVersion);

    console.log('allEnvironments', allEnvironments);

    const environments = (
        hideOlderAndPreRelease
            ? filterEnvironments(allEnvironments)
            : allEnvironments
    ).filter(
        environment =>
            showPreReleases ||
            !semver.prerelease(environment.version) ||
            environment.isInstalled
    );

    if (environments.length === 0) {
        return (
            <div className="tw-preflight tw-relative tw-flex tw-w-full tw-items-center tw-bg-white tw-p-4 tw-leading-none">
                <p>There are no environments available for installation.</p>
            </div>
        );
    }

    return (
        <div className="tw-flex tw-flex-col tw-gap-2">
            {environments.map(environment => (
                <Environment
                    key={environment.version}
                    environment={environment}
                />
            ))}
        </div>
    );
};

const useManagerHooks = () => {
    const dispatch = useDispatch();
    const verboseLogging = useSelector(isLoggingVerbose);
    const installDir = useSelector(currentInstallDir);

    useEffect(() => {
        const action = async () => {
            const dir = await persistedInstallDirOrToolChainDefault();
            setPersistedInstallDir(dir);
            dispatch(setInstallDir(dir));
            dispatch(initApp());
        };

        action();
    }, [dispatch]);

    useEffect(() => {
        const fallback = isDevelopment ? 'error' : 'off';
        toolchainManager.setLogLevel(verboseLogging ? 'trace' : fallback);
    }, [verboseLogging]);

    useEffect(() => {
        if (installDir) {
            dispatch(initEnvironments());
        }
    }, [dispatch, installDir]);
};

export default () => {
    const dispatch = useDispatch();

    useManagerHooks();
    const showingFirstSteps = useSelector(isShowingFirstSteps);

    const environmentsListInitialized = useSelector(
        isEnvironmentsListInitialized
    );

    if (showingFirstSteps) {
        logger.info('Show first install instructions');
        telemetry.sendEvent(EventAction.SHOW_FIRST_INSTALL_INSTRUCTIONS, {
            platform: process.platform,
            arch: process.arch,
        });
        return <FirstInstallInstructions />;
    }

    if (!environmentsListInitialized) {
        return (
            <div className="tw-flex tw-justify-center">
                <Spinner size="lg" />
            </div>
        );
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

                let pkg = evt.dataTransfer.getData('text');
                if (!pkg) {
                    pkg = webUtils.getPathForFile(evt.dataTransfer.files[0]);
                }

                dispatch(showInstallPackageDialog(pkg));
            }}
            className="toolchain-manager-main-window"
        >
            <Alert variant="info">
                Since the nRF Connect SDK v2.0.0, the nRF Connect for VS Code
                extension is the recommended IDE for managing the nRF Connect
                SDK Toolchain and working with the nRF Connect SDK. The
                extension also provides support for the command line
                environment.{' '}
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://marketplace.visualstudio.com/items?itemName=nordic-semiconductor.nrf-connect-extension-pack"
                >
                    <b>Install the extension</b>
                </a>
            </Alert>
            <PlatformInstructions />
            <EnvironmentGuide />
            <Environments />
            <ButtonToolbar className="justify-content-end flex-row pt-3">
                <Button
                    variant="link"
                    className="mdi x-mdi-briefcase-plus-outline pr-0 pt-0"
                    onClick={() => dispatch(showInstallPackageDialog(''))}
                >
                    Install 1.x package from other source
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

const initApp = (): AppThunk<RootState, Promise<void>> => async dispatch => {
    await dispatch(detectMultipleInstallDirs());
    await dispatch(reportVsCodeStatus());
};

const nrfjprogStatusToString = (status: NrfjprogStatus) => {
    switch (status) {
        case NrfjprogStatus.NOT_INSTALLED:
            return 'Not installed';
        case NrfjprogStatus.INSTALLED:
            return 'Installed';
        case NrfjprogStatus.RECOMMEND_UNIVERSAL:
            return 'Intel version installed';
    }
};

const reportVsCodeStatus =
    (): AppThunk<RootState, Promise<void>> => async dispatch => {
        const status = await dispatch(getVsCodeStatus());
        const nrfjprogInstallStatus = await getNrfjprogStatus();
        const statusString = {
            [VsCodeStatus.INSTALLED]: 'VS Code installed',
            [VsCodeStatus.MISSING_EXTENSIONS]: 'Extensions are missing',
            [VsCodeStatus.MISSING_NRFJPROG]: 'nRFjprog is missing',
            [VsCodeStatus.NOT_CHECKED]: 'Status not checked',
            [VsCodeStatus.NOT_INSTALLED]: 'VS Code not installed',
            [VsCodeStatus.RECOMMEND_UNIVERSAL]:
                'VS Code Intel version installed',
            [VsCodeStatus.NRFJPROG_RECOMMEND_UNIVERSAL]:
                'nRFjprog Intel version installed',
        }[status];

        telemetry.sendEvent(EventAction.VS_INSTALLED, { statusString });
        telemetry.sendEvent(EventAction.NRFJPROG_INSTALLED, {
            statusString: nrfjprogStatusToString(nrfjprogInstallStatus),
        });
    };
