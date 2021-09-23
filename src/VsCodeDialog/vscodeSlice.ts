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
    MISSING_EXTENSIONS,
    MISSING_NRFJPROG,
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
    state: VsCodeExtensionState;
}

export interface VsCodeState {
    status: VsCodeStatus;
    extensions: VsCodeExtension[];
    isDialogVisible: boolean;
}

const initialState: VsCodeState = {
    status: VsCodeStatus.NOT_CHECKED,
    extensions: [],
    isDialogVisible: false,
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
        installExtensionFailed(state, action) {
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.state = VsCodeExtensionState.FAILED;
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
        setVsCodeDialogHidden,
    },
} = slice;

export const vsCodeStatus = ({ app: { vsCode } }: RootState) => vsCode.status;
export const vsCodeExtensions = ({ app: { vsCode } }: RootState) =>
    vsCode.extensions;
export const isDialogVisible = ({ app: { vsCode } }: RootState) =>
    vsCode.isDialogVisible;
