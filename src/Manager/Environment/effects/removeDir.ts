/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import fse from 'fs-extra';
import path from 'path';
import { ErrorDialogActions, usageData } from 'pc-nrfconnect-shared';

import { Dispatch } from '../../../state';

export const removeDir = async (dispatch: Dispatch, srcDir: string) => {
    let renameOfDirSuccessful = false;
    try {
        const toBeDeletedDir = path.resolve(srcDir, '..', 'toBeDeleted');
        await fse.move(srcDir, toBeDeletedDir, { overwrite: true });
        renameOfDirSuccessful = true;
        await fse.remove(toBeDeletedDir);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        const errorMsg =
            `Failed to remove ${srcDir}, ${message}. ` +
            'Please close any application or window that might keep this ' +
            'environment locked, then try to remove it again.';
        dispatch(ErrorDialogActions.showDialog(errorMsg));
        usageData.sendErrorReport(errorMsg);
    }
    return renameOfDirSuccessful;
};
