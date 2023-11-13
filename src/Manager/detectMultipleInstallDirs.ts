/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AppThunk } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { readdirSync } from 'fs';

import { setInstallDir } from '../InstallDir/installDirSlice';
import {
    oldDefaultInstallDirOnWindows,
    persistedInstallDir,
} from '../persistentStore';
import { showReduxConfirmDialogAction } from '../ReduxConfirmDialog/reduxConfirmDialogSlice';
import { RootState } from '../state';

const filesIn = (dir: string) => {
    try {
        return readdirSync(dir);
    } catch (error) {
        return [];
    }
};

const containsFiles = (dir: string) => filesIn(dir).length > 0;

const showInstallDirConflictDialog = (oldDir: string, newDir: string) =>
    showReduxConfirmDialogAction({
        callback: () => {},
        title: 'Old SDK environments found',
        content:
            `You have old SDK environments in the folder \`${oldDir}\` ` +
            `and also already installed a new SDK environment in the folder ` +
            `\`${newDir}\`.\n\n` +
            `For now, only the new SDK environment will be visible as ` +
            `installed environment. \n\n` +
            `The old SDK environments will still be there and you can ` +
            `continue to work with them, e.g. in VS Code. But if you want ` +
            `to see and work with them again here in the Toolchain Manager ` +
            `you first have to change the installation directory in the ` +
            `settings back to \`${oldDir}\`. If you need to see the new ` +
            `SDK toolchains here again, you can again switch the ` +
            `installation directory to \`${newDir}\`.` +
            `\n\n` +
            `As an alternative, you can also install the old SDK ` +
            `environments again in the folder \`${newDir}\` by clicking ` +
            `“Install” next to them. But please note that any current ` +
            `projects you have might reference the SDK environment in the ` +
            `old folder \`${oldDir}\`.`,
        hideCancel: true,
    });

export default (): AppThunk<RootState> => dispatch => {
    const newDefaultInstallDir = persistedInstallDir();
    if (process.platform !== 'win32' || !newDefaultInstallDir) return;

    const oldDefaultInstallDir = oldDefaultInstallDirOnWindows;

    const oldDefaultInstallDirIsUsed = containsFiles(oldDefaultInstallDir);
    const newDefaultInstallDirIsUsed = containsFiles(newDefaultInstallDir);

    if (oldDefaultInstallDirIsUsed && newDefaultInstallDirIsUsed) {
        dispatch(
            showInstallDirConflictDialog(
                oldDefaultInstallDir,
                newDefaultInstallDir
            )
        );
        dispatch(setInstallDir(newDefaultInstallDir));
    }

    if (oldDefaultInstallDirIsUsed && !newDefaultInstallDirIsUsed) {
        dispatch(setInstallDir(oldDefaultInstallDir));
    }

    if (!oldDefaultInstallDirIsUsed && newDefaultInstallDirIsUsed) {
        dispatch(setInstallDir(newDefaultInstallDir));
    }
};
