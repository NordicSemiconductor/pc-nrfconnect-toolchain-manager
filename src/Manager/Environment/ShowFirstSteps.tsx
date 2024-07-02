/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { Button, openUrl } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { Environment } from '../../state';
import { selectEnvironment, showFirstSteps } from '../managerSlice';
import {
    isLegacyEnvironment,
    isOnlyAvailable,
    version,
} from './environmentReducer';

const ShowFirstSteps = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch();
    if (isOnlyAvailable(environment)) return null;

    return isLegacyEnvironment(environment.version) ? (
        <Button
            onClick={() => {
                dispatch(selectEnvironment(version(environment)));
                dispatch(showFirstSteps());
            }}
            title="Show how to build a sample project"
            variant="secondary"
            size="lg"
        >
            First steps
        </Button>
    ) : (
        <Button
            title="Show how to build a sample project (External website)"
            variant="secondary"
            onClick={() =>
                openUrl(
                    'https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/create_application.html'
                )
            }
            size="lg"
        >
            First steps
        </Button>
    );
};

export default ShowFirstSteps;
