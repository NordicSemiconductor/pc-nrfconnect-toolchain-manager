/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { usageData } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../state';
import EventAction from '../usageDataActions';

export enum VsCodeStatus {
    NOT_CHECKED,
    INSTALLED,
    NOT_INSTALLED,
    MISSING_EXTENSIONS,
    MISSING_NRFJPROG,
    RECOMMEND_UNIVERSAL,
    NRFJPROG_RECOMMEND_UNIVERSAL,
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
            const extension = state.extensions.find(
                e => e.identifier === action.payload
            );
            if (extension) extension.state = VsCodeExtensionState.INSTALLING;
        },
        installedExtension(state, action) {
            usageData.sendUsageData(
                EventAction.INSTALL_VS_EXTENSION,
                action.payload
            );

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
        showVsCodeDialog,
        setVsCodeStatus,
        setVsCodeExtensions,
        startInstallingExtension,
        installedExtension,
        installExtensionFailed,
        hideVsCodeDialog,
    },
} = slice;

export const vsCodeStatus = ({ app: { vsCode } }: RootState) => vsCode.status;
export const vsCodeExtensions = ({ app: { vsCode } }: RootState) =>
    vsCode.extensions;
export const isDialogVisible = ({ app: { vsCode } }: RootState) =>
    vsCode.isDialogVisible;
