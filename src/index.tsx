/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    App,
    isDevelopment,
    isLoggingVerbose,
    render,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { currentInstallDir, setInstallDir } from './InstallDir/installDirSlice';
import initEnvironments from './Manager/initEnvironments';
import Manager from './Manager/Manager';
import toolchainManager from './Manager/ToolchainManager/toolchainManager';
import { persistedInstallDir, setPersistedInstallDir } from './persistentStore';
import appReducer from './reducers';
import Settings from './Settings/Settings';

import './style.scss';

usageData.enableTelemetry();

const ToolchainManagerEffects = () => {
    const dispatch = useDispatch();
    const verboseLogging = useSelector(isLoggingVerbose);
    const installDir = useSelector(currentInstallDir);

    useEffect(() => {
        const fallback = isDevelopment ? 'error' : 'off';
        toolchainManager.setLogLevel(verboseLogging ? 'trace' : fallback);
    }, [verboseLogging]);

    useEffect(() => {
        if (!persistedInstallDir()) {
            toolchainManager.config().then(config => {
                setPersistedInstallDir(config.install_dir);
                dispatch(setInstallDir(config.install_dir));
            });
        }
    }, [dispatch]);

    useEffect(() => {
        dispatch(initEnvironments());
    }, [dispatch, installDir]);

    return null;
};

render(
    <App
        appReducer={appReducer}
        deviceSelect={null}
        sidePanel={null}
        panes={[
            { name: 'SDK Environments', Main: Manager },
            { name: 'Settings', Main: Settings },
        ]}
        showLogByDefault={false}
    >
        <ToolchainManagerEffects />
    </App>
);
