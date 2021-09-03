/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice } from '@reduxjs/toolkit';

import { Dispatch, RootState } from '../state';
import { getVsCodeStatus, VsCodeStatus } from './vscode';

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
        showVsCodeDialog: state => {
            state.isDialogVisible = true;
        },
        hideVsCodeDialog: state => {
            state.isDialogVisible = false;
        },
        setVsCodeStatus: (state, action) => {
            state.status = action.payload;
        },
        setVsCodeExtensions: (state, action) => {
            state.extensions = action.payload;
        },
        startInstallingExtension(state, action) {
            state.extensions.find(e => e.identifier === action.payload)!.state =
                VsCodeExtensionState.INSTALLING;
        },
        installedExtension(state, action) {
            state.extensions.find(e => e.identifier === action.payload)!.state =
                VsCodeExtensionState.INSTALLED;
        },
        setVsCodeNrfjprogInstalled(state, action) {
            state.nrfjprogInstalled = action.payload;
        },
        installExtensionFailed(state, action) {
            state.extensions.find(e => e.identifier === action.payload)!.state =
                VsCodeExtensionState.FAILED;
        },
        selectExtension(state, action) {
            state.extensions.find(
                e => e.identifier === action.payload
            )!.selected = true;
        },
        deselectExtension(state, action) {
            state.extensions.find(
                e => e.identifier === action.payload
            )!.selected = false;
        },
        setToolchainDir(state, action) {
            state.toolchainDir = action.payload;
        },
    },
});

export const {
    reducer,
    actions: {
        setVsCodeStatus,
        setVsCodeExtensions,
        startInstallingExtension,
        installedExtension,
        installExtensionFailed,
        setVsCodeNrfjprogInstalled,
        hideVsCodeDialog,
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
export const allVsCodeExtensionsInstalled = ({ app: { vsCode } }: RootState) =>
    vsCode.extensions.every(e => e.state === VsCodeExtensionState.INSTALLED);
export const getToolchainDir = ({ app: { vsCode } }: RootState) =>
    vsCode.toolchainDir;

export const showVsCodeDialog = () => async (dispatch: Dispatch) =>
    dispatch(getVsCodeStatus()).then(status => {
        dispatch(setVsCodeStatus(status));
        if (status !== VsCodeStatus.INSTALLED)
            dispatch(slice.actions.showVsCodeDialog());
        return Promise.resolve(status);
    });
