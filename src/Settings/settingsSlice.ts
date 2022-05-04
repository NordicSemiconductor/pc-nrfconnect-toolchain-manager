/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    persistedHideOlderEnvironments,
    setPersistedHideOlderEnvironments,
} from '../persistentStore';
import type { RootState } from '../state';

export interface SettingsState {
    isOlderEnvironmentsHidden: boolean;
}

const initialState: SettingsState = {
    isOlderEnvironmentsHidden: persistedHideOlderEnvironments(),
};

const slice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        showOlderEnvironments: (state, action: PayloadAction<boolean>) => {
            setPersistedHideOlderEnvironments(action.payload);
            state.isOlderEnvironmentsHidden = action.payload;
        },
    },
});

export const {
    reducer,
    actions: { showOlderEnvironments },
} = slice;

export const isOlderEnvironmentsHidden = ({ app: { settings } }: RootState) =>
    settings.isOlderEnvironmentsHidden;
