/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';

import { Environment } from '../../state';
import Button from './Button';
import environmentPropType from './environmentPropType';
import { isInProgress } from './environmentReducer';
import { openSegger } from './segger';

type Props = { environment: Environment };

const OpenSegger = ({ environment }: Props) => {
    if (environment.isWestPresent && environment.type === 'legacy') {
        return (
            <Button
                icon="x-mdi-rocket"
                onClick={() => openSegger(environment.toolchainDir)}
                label="Open Segger Embedded Studio"
                title="Open SEGGER Embedded Studio"
                disabled={isInProgress(environment)}
                variant="primary"
            />
        );
    }

    return null;
};

OpenSegger.propTypes = { environment: environmentPropType.isRequired };

export default OpenSegger;
