/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    App,
    isDevelopment,
    isLoggingVerbose,
    render,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import Manager from './Manager/Manager';
import toolchainManager from './Manager/ToolchainManager/toolchainManager';
import appReducer from './reducers';
import Settings from './Settings/Settings';

import './style.scss';

usageData.enableTelemetry();

const ToolchainManagerEffects = () => {
    const verboseLogging = useSelector(isLoggingVerbose);
    useEffect(() => {
        const fallback = isDevelopment ? 'error' : 'off';
        toolchainManager.setLogLevel(verboseLogging ? 'trace' : fallback);
    }, [verboseLogging]);

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
