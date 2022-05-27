/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { NrfUtilEnvironment, TaskEvent } from '../../state';

type VersionPayload<T> = PayloadAction<{ payload: T } & { version: string }>;

const nrfUtilEnvironmentSlice = createSlice({
    initialState: <NrfUtilEnvironment>{},
    name: 'nrfUtilEnvironments',
    reducers: {
        addTaskEvent: (state, action: VersionPayload<TaskEvent>) => {
            const { id } = action.payload.payload.data.task;
            const currentTaskEvents = state.tasks[id] ?? [];
            const taskEvents = [...currentTaskEvents, action.payload.payload];
            state.tasks[id] = taskEvents;
        },
    },
});

export const {
    reducer,
    actions: { addTaskEvent },
} = nrfUtilEnvironmentSlice;
