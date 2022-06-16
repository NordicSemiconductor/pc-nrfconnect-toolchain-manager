/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../state';

export interface ConfirmDialogState {
    callback: null | ((isCancelled: boolean) => void);
    title?: string;
    content?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onOptional?: (isCancelled: boolean) => void;
    optionalLabel?: string;
    hideCancel?: boolean;
}

const initialState: ConfirmDialogState = {
    callback: null,
};

const slice = createSlice({
    name: 'reduxConfirmDialog',
    initialState,
    reducers: {
        showReduxConfirmDialogAction: (
            state,
            action: PayloadAction<ConfirmDialogState>
        ) => ({ ...state, ...action.payload }),
        hideReduxConfirmDialogAction: () => initialState,
    },
});

export const {
    reducer,
    actions: { hideReduxConfirmDialogAction, showReduxConfirmDialogAction },
} = slice;

export const reduxConfirmDialogSelector = ({ app }: RootState) =>
    app.reduxConfirmDialog;
