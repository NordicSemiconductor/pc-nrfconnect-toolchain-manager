/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Alert, Toggle } from 'pc-nrfconnect-shared';

import {
    setShowDeprecationWarning,
    showDeprecationWarning,
} from './persistentStore';

export default () => {
    const [show, setShow] = React.useState(showDeprecationWarning());
    const [hideForever, setHideForever] = React.useState(false);
    return (
        show && (
            <Alert
                variant="warning"
                dismissable
                onClose={() => {
                    if (hideForever) {
                        setShowDeprecationWarning(false);
                        setShow(false);
                    }
                }}
            >
                <p>
                    In the near future The nRF Connect for Desktop Toolchain
                    manager will will no longer be used to install toolchains
                    and nRF Connect SDK. Toolchain and SDK management will then
                    only be available in nRF Connect for VS Code with a nrfutil
                    command line alternative. The toolchain management feature
                    is already available in VS Code and nrfutil.
                </p>
                <p>
                    When this update is released the Toolchain Manager will only
                    support nRF Connect SDK versions below 2.0.0 to support
                    users which need to work with 1.x SDK versions.
                </p>
                <p>
                    <Toggle
                        isToggled={hideForever}
                        onToggle={setHideForever}
                        label="Don't show this in the future"
                    />
                </p>
            </Alert>
        )
    );
};
