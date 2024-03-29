/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { telemetry } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { getExistingAbortController } from '../../globalAbortControler';
import { Environment } from '../../state';
import Button from './Button';
import { isDoingFreshInstall, isLegacyEnvironment } from './environmentReducer';

type Props = { environment: Environment };

const Cancel = ({ environment }: Props) => {
    const onCancel = () => {
        getExistingAbortController()?.abort();
        telemetry.sendEvent('Cancel installation', {
            version: environment.version,
        });
    };

    if (
        isLegacyEnvironment(environment.version) ||
        !isDoingFreshInstall(environment)
    )
        return null;

    return (
        <Button
            icon="x-mdi-briefcase-download-outline"
            onClick={onCancel}
            label="Cancel"
            variant="secondary"
        />
    );
};

export default Cancel;
