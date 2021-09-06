/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    persistedShowMaster,
    persistedShowOlderToolchains,
    persistedShowVsCode,
    setPersistedShowMaster,
    setPersistedShowVsCode,
} from '../persistentStore';
import { RootState } from '../state';

export interface SettingsState {
    isMasterVisible: boolean;
    isVsCodeVisible: boolean;
    showOlderToolchains: boolean;
}

const initialState: SettingsState = {
    isMasterVisible: persistedShowMaster(),
    isVsCodeVisible: persistedShowVsCode(),
    showOlderToolchains: persistedShowOlderToolchains(),
};

const slice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        showMasterEnvironment: (state, action: PayloadAction<boolean>) => {
            setPersistedShowMaster(action.payload);
            state.isMasterVisible = action.payload;
        },
        showVsCode: (state, action: PayloadAction<boolean>) => {
            setPersistedShowVsCode(action.payload);
            state.isVsCodeVisible = action.payload;
        },
    },
});

export const {
    reducer,
    actions: { showMasterEnvironment, showVsCode },
} = slice;

export const isMasterVisible = ({ app: { settings } }: RootState) =>
    settings.isMasterVisible;

export const isVsCodeVisible = ({ app: { settings } }: RootState) =>
    settings.isVsCodeVisible;

export const showOlderToolchains = ({ app: { settings } }: RootState) =>
    settings.showOlderToolchains;
