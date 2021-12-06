/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fs from 'fs';
import path from 'path';

export const isWestPresent = (toolchainDir: string) =>
    fs.existsSync(path.resolve(toolchainDir, '../.west/config'));

export const calculateTimeConsumed = (timeStart: Date) =>
    Math.round((new Date().getTime() - timeStart.getTime()) / 1000 / 60);
