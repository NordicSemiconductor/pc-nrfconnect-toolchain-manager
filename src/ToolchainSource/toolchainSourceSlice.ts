/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { toolchainIndexUrl } from '../persistentStore';
import type { RootState } from '../state';

export interface ToolChainSourceState {
    toolchainRootUrl: string;
    isDialogVisible: boolean;
}

const initialState: ToolChainSourceState = {
    toolchainRootUrl: toolchainIndexUrl(),
    isDialogVisible: false,
};

const slice = createSlice({
    name: 'toolchainSource',
    initialState,
    reducers: {
        setToolchainSource: (
            state,
            toolchainRootUrl: PayloadAction<string>
        ) => {
            state.toolchainRootUrl = toolchainRootUrl.payload;
        },

        showSetToolchainSourceDialog: state => {
            state.isDialogVisible = true;
        },

        hideSetToolchainSourceDialog: state => {
            state.isDialogVisible = false;
        },
    },
});

export const {
    reducer,
    actions: {
        setToolchainSource,
        showSetToolchainSourceDialog,
        hideSetToolchainSourceDialog,
    },
} = slice;

export const toolchainRootUrl = ({ app }: RootState) =>
    app.toolchainSource.toolchainRootUrl;
export const isDialogVisible = ({ app }: RootState) =>
    app.toolchainSource.isDialogVisible;
