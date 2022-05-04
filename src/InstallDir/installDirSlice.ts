/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getEnvironment } from '../Manager/managerSlice';
import {
    persistedInstallDir,
    setPersistedInstallDir,
} from '../persistentStore';
import type { RootState } from '../state';

const CONFIRM_DIR = Symbol('Confirm the install directory');
const SET_DIR = Symbol('Set the install directory');

export interface InstallDirectoryState {
    currentDir: string;
    isDialogVisible: boolean;
    dialogFlavour?: symbol;
    versionToInstall?: string;
}

const initialState: InstallDirectoryState = {
    currentDir: persistedInstallDir(),
    isDialogVisible: false,
};

const slice = createSlice({
    name: 'installDir',
    initialState,
    reducers: {
        setInstallDir: (state, directory: PayloadAction<string>) => {
            setPersistedInstallDir(directory.payload);
            state.currentDir = directory.payload;
        },
        showConfirmInstallDirDialog: (
            state,
            version: PayloadAction<string>
        ) => {
            state.isDialogVisible = true;
            state.dialogFlavour = CONFIRM_DIR;
            state.versionToInstall = version.payload;
        },
        showSetInstallDirDialog: state => {
            state.isDialogVisible = true;
            state.dialogFlavour = SET_DIR;
        },
        hideInstallDirDialog: state => {
            state.isDialogVisible = false;
        },
    },
});

export const {
    reducer,
    actions: {
        hideInstallDirDialog,
        setInstallDir,
        showConfirmInstallDirDialog,
        showSetInstallDirDialog,
    },
} = slice;

export const currentInstallDir = (state: RootState) =>
    state.app.installDir.currentDir;
export const isDialogVisible = (state: RootState) =>
    state.app.installDir.isDialogVisible;
export const isConfirmDirFlavour = (state: RootState) =>
    state.app.installDir.dialogFlavour === CONFIRM_DIR;
export const environmentToInstall = (state: RootState) =>
    getEnvironment(state, state.app.installDir.versionToInstall ?? '');
