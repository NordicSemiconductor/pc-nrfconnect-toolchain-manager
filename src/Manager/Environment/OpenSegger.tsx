/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Button } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { Environment } from '../../state';
import { isInProgress } from './environmentReducer';
import { openSegger } from './segger';

export default ({ environment }: { environment: Environment }) => {
    if (environment.isWestPresent && environment.type === 'legacy') {
        return (
            <Button
                onClick={() => openSegger(environment.toolchainDir)}
                title="Open SEGGER Embedded Studio"
                disabled={isInProgress(environment)}
                variant="primary"
                size="lg"
            >
                Open Segger Embedded Studio
            </Button>
        );
    }

    return null;
};
