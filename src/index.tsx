/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    App,
    render,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import Manager from './Manager/Manager';
import appReducer from './reducers';
import Settings from './Settings/Settings';

import './style.scss';

usageData.enableTelemetry();

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
        feedback
    />
);
