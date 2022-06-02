/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { combineReducers } from 'redux';

import { reducer as installDir } from './InstallDir/installDirSlice';
import manager from './Manager/managerSlice';
import { reducer as nrfUtilDialog } from './Manager/nrfutil/nrfUtilDialogSlice';
import { reducer as reduxConfirmDialog } from './ReduxConfirmDialog/reduxConfirmDialogSlice';
import { reducer as settings } from './Settings/settingsSlice';
import { reducer as toolchainSource } from './ToolchainSource/toolchainSourceSlice';
import { reducer as vsCode } from './VsCodeDialog/vscodeSlice';

const rootReducer = combineReducers({
    installDir,
    manager,
    toolchainSource,
    reduxConfirmDialog,
    settings,
    vsCode,
    nrfUtilDialog,
});

export default rootReducer;
