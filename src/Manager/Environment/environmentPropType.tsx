/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { arrayOf, bool, number, oneOfType, shape, string } from 'prop-types';

export default shape({
    version: string.isRequired,
    toolchainDir: string,
    toolchains: arrayOf(
        shape({
            version: string.isRequired,
            name: string.isRequired,
            sha512: string.isRequired,
        }).isRequired
    ),
    progress: oneOfType([number, string]),
    isInstallingToolchain: bool,
    isCloningSdk: bool,
    isWestPresent: bool,
    isInstalled: bool,
    isRemoving: bool,
});
