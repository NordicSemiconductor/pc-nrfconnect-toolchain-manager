/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { logger } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { spawnSync } from 'child_process';

import { showReduxConfirmDialogAction } from '../../../ReduxConfirmDialog/reduxConfirmDialogSlice';
import { Dispatch } from '../../../state';

const xcodeCommandLineToolsExist = () => {
    const tcm = spawnSync('xcode-select', ['-p'], {
        encoding: 'utf8',
    });

    logger.info(
        'Checking installation of XCode Command Line Tools: ',
        tcm.stdout
    );
    return tcm.status === 0;
};

export default (dispatch: Dispatch) => {
    if (process.platform !== 'darwin' || xcodeCommandLineToolsExist()) return;

    dispatch(
        showReduxConfirmDialogAction({
            callback: () => {},
            title: 'Missing Command Line Tools for Xcode',
            content:
                'The Command Line Tools for Xcode are needed to ' +
                'use the nRF Connect SDK toolchain. Please ' +
                'install them by running `xcode-select ' +
                '--install` in a terminal.',
            hasSelectableContent: true,
            hideCancel: true,
            confirmLabel: 'Confirm',
        })
    );
};
