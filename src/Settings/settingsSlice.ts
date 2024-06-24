/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    persistedHideOlderEnvironments,
    setPersistedHideOlderEnvironments,
    setShowPreReleases,
    showPreReleases as persistedShowPreReleases,
} from '../persistentStore';
import type { RootState } from '../state';

export interface SettingsState {
    isOlderEnvironmentsHidden: boolean;
    showPreReleases: boolean;
}

const initialState: SettingsState = {
    isOlderEnvironmentsHidden: persistedHideOlderEnvironments(),
    showPreReleases: !!persistedShowPreReleases(),
};

const slice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        showOlderEnvironments: (state, action: PayloadAction<boolean>) => {
            setPersistedHideOlderEnvironments(action.payload);
            state.isOlderEnvironmentsHidden = action.payload;
        },
        showPreReleases: (state, action: PayloadAction<boolean>) => {
            setShowPreReleases(action.payload);
            state.showPreReleases = action.payload;
        },
    },
});

export const {
    reducer,
    actions: { showOlderEnvironments, showPreReleases },
} = slice;

export const isOlderEnvironmentsHidden = ({ app: { settings } }: RootState) =>
    settings.isOlderEnvironmentsHidden;

export const arePreReleaseShown = ({ app: { settings } }: RootState) =>
    !!settings.showPreReleases;
