/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { NrfConnectState } from 'pc-nrfconnect-shared';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { InstallDirectoryState } from './InstallDir/installDirSlice';
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
};

export type RootState = NrfConnectState<AppState>;
export type Dispatch = ThunkDispatch<RootState, null, AnyAction>;

export type TaskEvent = TaskBegin | TaskProgress | TaskEnd;

interface TaskDescriptor {
    id: string;
    description: string;
}

interface TaskBegin {
    type: 'task_begin';
    data: {
        task: TaskDescriptor;
    };
}

interface TaskProgress {
    type: 'task_progress';
    data: {
        task: TaskDescriptor;
        progress: {
            progressPercentage: number;
            description: string;
        };
    };
}

interface TaskEnd {
    type: 'task_end';
    data: {
        task: TaskDescriptor;
        message: string;
        result: 'success' | 'failure';
    };
}
