/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice } from '@reduxjs/toolkit';

import { RootState } from '../state';

export enum VsCodeStatus {
    NOT_CHECKED,
    INSTALLED,
    NOT_INSTALLED,
    MISSING_TOOLS,
}

export enum VsCodeExtensionState {
    INSTALLED,
    INSTALLING,
    FAILED,
    NOT_INSTALLED,
}

export interface VsCodeExtension {
    identifier: string;
    name: string;
    required: boolean;
    state: VsCodeExtensionState;
    selected: boolean;
}

export interface VsCodeState {
    status: VsCodeStatus;
    extensions: VsCodeExtension[];
    nrfjprogInstalled: boolean;
    isDialogVisible: boolean;
    toolchainDir?: string;
}

const initialState: VsCodeState = {
    status: VsCodeStatus.NOT_CHECKED,
    extensions: [],
    nrfjprogInstalled: false,
    isDialogVisible: false,
    toolchainDir: undefined,
};

const slice = createSlice({
    name: 'vsCode',
    initialState,
    reducers: {
        setVsCodeDialogVisible: state => {
            state.isDialogVisible = true;
        },
        setVsCodeDialogHidden: state => {
            state.isDialogVisible = false;
        },
        setVsCodeStatus: (state, action) => {
            state.status = action.payload;
        },
        setVsCodeExtensions: (state, action) => {
            state.extensions = action.payload;
        },
        startInstallingExtension(state, action) {
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.state = VsCodeExtensionState.INSTALLING;
        },
        installedExtension(state, action) {
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.state = VsCodeExtensionState.INSTALLED;
        },
        setVsCodeNrfjprogInstalled(state, action) {
            state.nrfjprogInstalled = action.payload;
        },
        installExtensionFailed(state, action) {
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.state = VsCodeExtensionState.FAILED;
        },
        selectExtension(state, action) {
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.selected = true;
        },
        deselectExtension(state, action) {
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.selected = false;
        },
        setToolchainDir(state, action) {
            state.toolchainDir = action.payload;
        },
    },
});

export const {
    reducer,
    actions: {
        setVsCodeDialogVisible,
        setVsCodeStatus,
        setVsCodeExtensions,
        startInstallingExtension,
        installedExtension,
        installExtensionFailed,
        setVsCodeNrfjprogInstalled,
        setVsCodeDialogHidden,
        selectExtension,
        deselectExtension,
        setToolchainDir,
    },
} = slice;

export const vsCodeStatus = ({ app: { vsCode } }: RootState) => vsCode.status;
export const vsCodeExtensions = ({ app: { vsCode } }: RootState) =>
    vsCode.extensions;
export const nrfjprogInstalled = ({ app: { vsCode } }: RootState) =>
    vsCode.nrfjprogInstalled;
export const isDialogVisible = ({ app: { vsCode } }: RootState) =>
    vsCode.isDialogVisible;
export const getToolchainDir = ({ app: { vsCode } }: RootState) =>
    vsCode.toolchainDir;
