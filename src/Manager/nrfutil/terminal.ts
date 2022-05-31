/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec } from 'child_process';

import nrfutilToolchainManager from './nrfutilToolchainManager';

export const launchWinBash = () => {
    exec(`${nrfutilToolchainManager()}  launch cmd.exe /k start bash.exe`);
};

export const launchTerminal = () => {
    exec(`${nrfutilToolchainManager()}  launch --terminal`);
};
