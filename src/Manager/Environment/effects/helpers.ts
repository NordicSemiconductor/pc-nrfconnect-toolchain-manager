/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fs from 'fs';
import path from 'path';

import sdkPath from '../../sdkPath';
import { isLegacyEnvironment } from '../environmentReducer';

export const isWestPresent = async (version: string, toolchainDir: string) => {
    const installDir = await sdkPath(version);
    if (isLegacyEnvironment(version))
        return fs.existsSync(path.resolve(toolchainDir, '../.west/config'));
    return fs.existsSync(path.resolve(installDir, '.west/config'));
};

export const calculateTimeConsumed = (timeStart: Date) =>
    Math.round((new Date().getTime() - timeStart.getTime()) / 1000 / 60);
