/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { App } from '@nordicsemiconductor/pc-nrfconnect-shared';

import Manager from './Manager/Manager';
import appReducer from './reducers';
import Settings from './Settings/Settings';

import './style.scss';

export default () => (
    <App
        reportUsageData
        appReducer={appReducer}
        deviceSelect={null}
        sidePanel={null}
        panes={[
            { name: 'SDK Environments', Main: Manager },
            { name: 'Settings', Main: Settings },
        ]}
        showLogByDefault={false}
    />
);
