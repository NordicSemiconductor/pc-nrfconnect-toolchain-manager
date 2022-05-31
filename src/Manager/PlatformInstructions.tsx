/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Alert from 'react-bootstrap/Alert';

const isLinux = process.platform === 'linux';

const OnlineDocs: FC<{ label: string }> = ({ label }) => (
    <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/gs_installing.html"
    >
        {label}
    </a>
);

export default () => {
    if (!isLinux) return null;

    return (
        <Alert variant="warning">
            <b>
                Linux currently only supports toolchains from version 2.0.0 and
                later on this app.{' '}
            </b>
            <OnlineDocs label="Installation instructions for Linux" />
        </Alert>
    );
};
