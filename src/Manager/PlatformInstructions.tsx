/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC, useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import { execSync } from 'child_process';

const isLinux = process.platform === 'linux';

export const enableLinux = true;

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

    const [isSnapAvailable, setSnapAvailable] = useState(true);

    useEffect(() => {
        if (!enableLinux || !isLinux) return;
        try {
            execSync('which snap');
        } catch (err) {
            setSnapAvailable(false);
        }
    }, []);

    return (
        <>
            <Alert variant="warning">
                <b>Linux is currently not supported by this app. </b>
                <OnlineDocs label="Installation instructions for Linux" />
            </Alert>
            {!isSnapAvailable && (
                <Alert variant="danger">
                    Linux support depends on <b>snap</b> which seems
                    unavailable, please install the package.
                    <br />
                    For more information please follow the manual for your{' '}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://snapcraft.io/docs/installing-snapd"
                    >
                        distribution
                    </a>
                    .
                </Alert>
            )}
        </>
    );
};
