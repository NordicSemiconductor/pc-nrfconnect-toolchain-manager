/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import path from 'path';

export const removeDir = async (srcDir: string) => {
    const toBeDeletedDir = path.resolve(srcDir, '..', 'toBeDeleted');
    try {
        await fse.rename(srcDir, toBeDeletedDir);
        await fse.remove(toBeDeletedDir);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        const errorMsg =
            `Failed to remove ${srcDir}, ${message}. ` +
            'Please close any application or window that might keep this ' +
            'environment locked, then try to remove it again.';

        throw new Error(errorMsg);
    }
};
