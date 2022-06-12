/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { NrfConnectState } from 'pc-nrfconnect-shared';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { InstallDirectoryState } from './InstallDir/installDirSlice';
import { nrfUtilDialogState } from './Manager/nrfutil/nrfUtilDialogSlice';
import { ConfirmDialogState } from './ReduxConfirmDialog/reduxConfirmDialogSlice';
import { SettingsState } from './Settings/settingsSlice';
import { ToolChainSourceState as ToolchainSourceState } from './ToolchainSource/toolchainSourceSlice';
import { VsCodeState } from './VsCodeDialog/vscodeSlice';

export type Toolchain = {
    version: string;
    name: string;
    sha512: string;
    uri?: string;
};

export type Environment = {
    type: 'nrfUtil' | 'legacy';
    version: string;
    toolchains: Toolchain[];
    toolchainDir: string;

    isInstalled?: boolean;
    isWestPresent?: boolean;
    isInstallingToolchain?: boolean;
    isCloningSdk?: boolean;
    isRemoving?: boolean;
    progress?: number;
    stage?: string;
    abortController: AbortController;
};

export type Environments = {
    [key: string]: Environment;
};

export type Manager = {
    environments: Environments;
    dndPackage: string | null;
    isRemoveDirDialogVisible: boolean;
    isInstallPackageDialogVisible: boolean;
    isShowingFirstSteps: boolean;
    versionToRemove: string;
    selectedVersion?: string;
};

export type AppState = {
    installDir: InstallDirectoryState;
    manager: Manager;
    toolchainSource: ToolchainSourceState;
    reduxConfirmDialog: ConfirmDialogState;
    settings: SettingsState;
    vsCode: VsCodeState;
    nrfUtilDialog: nrfUtilDialogState;
};

export type RootState = NrfConnectState<AppState>;
export type Dispatch = ThunkDispatch<RootState, null, AnyAction>;
