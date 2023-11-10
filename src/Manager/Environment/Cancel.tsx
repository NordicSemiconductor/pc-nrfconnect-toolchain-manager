/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { usageData } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { Environment } from '../../state';
import Button from './Button';
import { isDoingFreshInstall, isLegacyEnvironment } from './environmentReducer';

type Props = { environment: Environment };

const Cancel = ({ environment }: Props) => {
    const onCancel = () => {
        environment.abortController.abort();
        usageData.sendUsageData('Cancel installation', environment.version);
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
