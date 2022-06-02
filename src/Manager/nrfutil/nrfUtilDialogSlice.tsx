/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../state';

export interface nrfUtilDialogState {
    title?: string;
    content?: string;
    isVisible: boolean;
}

const initialState: nrfUtilDialogState = {
    title: '',
    content: '',
    isVisible: false,
};

const slice = createSlice({
    name: 'nrfUtilDialog',
    initialState,
    reducers: {
        showNrfUtilDialogAction: (
            state,
            action: PayloadAction<Omit<nrfUtilDialogState, 'isVisible'>>
        ) => ({ ...state, ...action.payload, isVisible: true }),
        hideNrfUtilDialogAction: () => initialState,
    },
});

export const {
    reducer,
    actions: { showNrfUtilDialogAction, hideNrfUtilDialogAction },
} = slice;

export const nrfUtilDialogSelector = ({ app }: RootState) => app.nrfUtilDialog;
