/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';

import { Environment } from '../../state';
import { selectEnvironment, showFirstSteps } from '../managerSlice';
import Button from './Button';
import {
    isLegacyEnvironment,
    isOnlyAvailable,
    version,
} from './environmentReducer';

type Props = { environment: Environment };
const ShowFirstSteps = ({ environment }: Props) => {
    const dispatch = useDispatch();
    if (isOnlyAvailable(environment)) return null;

    return isLegacyEnvironment(environment.version) ? (
        <Button
            icon="x-mdi-dog-service"
            onClick={() => {
                dispatch(selectEnvironment(version(environment)));
                dispatch(showFirstSteps());
            }}
            label="First steps"
            title="Show how to build a sample project"
            variant="secondary"
        />
    ) : (
        <Button
            icon="x-mdi-dog-service"
            label="First steps"
            title="Show how to build a sample project (External website)"
            variant="secondary"
            href="https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/create_application.html"
            target="_blank"
        />
    );
};

export default ShowFirstSteps;
