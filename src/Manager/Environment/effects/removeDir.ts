/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fs from 'fs';
import path from 'path';

export const removeDir = (srcDir: string) => {
    const toBeDeletedDir = path.resolve(srcDir, '..', 'toBeDeleted');
    try {
        fs.renameSync(srcDir, toBeDeletedDir);
        fs.rmSync(toBeDeletedDir, { recursive: true, force: true });
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        const errorMsg =
            `Failed to remove ${srcDir}, ${message}. ` +
            'Please close any application or window that might keep this ' +
            'environment locked, then try to remove it again.';

        throw new Error(errorMsg);
    }
};
