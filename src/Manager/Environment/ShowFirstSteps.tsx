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
import { isOnlyAvailable, version } from './environmentReducer';

type Props = { environment: Environment };
const ShowFirstSteps = ({ environment }: Props) => {
    const dispatch = useDispatch();
    if (isOnlyAvailable(environment)) return null;

    return (
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
    );
};

export default ShowFirstSteps;
