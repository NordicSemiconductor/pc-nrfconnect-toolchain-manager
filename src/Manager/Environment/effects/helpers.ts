/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fs from 'fs';
import path from 'path';

import sdkPath from '../../sdkPath';
import { isLegacyEnvironment } from '../environmentReducer';

export const isWestPresent = (version: string, toolchainDir: string) => {
    if (isLegacyEnvironment(version))
        return fs.existsSync(path.resolve(toolchainDir, '../.west/config'));
    return fs.existsSync(path.resolve(sdkPath(version), '.west/config'));
};

export const calculateTimeConsumed = (timeStart: Date) =>
    Math.round((new Date().getTime() - timeStart.getTime()) / 1000 / 60);
