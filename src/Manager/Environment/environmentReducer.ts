/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import type { Environment, NrfUtilEnvironment, TaskEvent } from '../../state';

const START_INSTALL_TOOLCHAIN = 'START_INSTALL_TOOLCHAIN';
export const startInstallToolchain = (version: string) => ({
    type: START_INSTALL_TOOLCHAIN,
    version,
});

const FINISH_INSTALL_TOOLCHAIN = 'FINISH_INSTALL_TOOLCHAIN';
export const finishInstallToolchain = (
    version: string,
    toolchainDir: string
) => ({
    type: FINISH_INSTALL_TOOLCHAIN,
    version,
    toolchainDir,
});

const START_CLONING_SDK = 'START_CLONING_SDK';
export const startCloningSdk = (version: string) => ({
    type: START_CLONING_SDK,
    version,
});

const FINISH_CLONING_SDK = 'FINISH_CLONING_SDK';
export const finishCloningSdk = (version: string, isWestPresent: boolean) => ({
    type: FINISH_CLONING_SDK,
    version,
    isWestPresent,
});

const START_REMOVING = 'START_REMOVING';
export const startRemoving = (version: string) => ({
    type: START_REMOVING,
    version,
});

const FINISH_REMOVING = 'FINISH_REMOVING';
export const finishRemoving = (version: string) => ({
    type: FINISH_REMOVING,
    version,
});

const SET_PROGRESS = 'SET_PROGRESS';
export const setProgress = (
    version: string,
    stage: string,
    progress = 100
) => ({
    type: SET_PROGRESS,
    version,
    stage,
    progress,
});

export const REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT';
export const removeEnvironmentReducer = (version: string) => ({
    type: REMOVE_ENVIRONMENT,
    version,
});

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

export default (environment: Environment, { type, ...action }: AnyAction) => {
    switch (type) {
        case START_INSTALL_TOOLCHAIN:
            return {
                ...environment,
                isInstallingToolchain: true,
            };
        case FINISH_INSTALL_TOOLCHAIN:
            return {
                ...environment,
                stage: null,
                isInstallingToolchain: false,
                toolchainDir: action.toolchainDir,
                isInstalled: true,
            };
        case START_CLONING_SDK:
            return { ...environment, isCloningSdk: true };
        case FINISH_CLONING_SDK:
            return {
                ...environment,
                isCloningSdk: false,
                isWestPresent: action.isWestPresent,
            };
        case START_REMOVING:
            return {
                ...environment,
                stage: 'Removing...',
                isRemoving: true,
                progress: 100,
            };
        case FINISH_REMOVING:
            return { ...environment, stage: null, isRemoving: false };
        case SET_PROGRESS:
            return { ...environment, ...action };
        case REMOVE_ENVIRONMENT:
            return { ...environment, isInstalled: false, isWestPresent: false };
        default:
            return environment;
    }
};

export const isInstallingToolchain = (env: Environment) =>
    env.isInstallingToolchain;
export const isCloningSdk = (env: Environment) => env.isCloningSdk;
export const isRemoving = (env: Environment) => env.isRemoving;
export const isInProgress = (env: Environment) =>
    env.isInstallingToolchain || env.isCloningSdk || env.isRemoving;

export const isInstalled = (env: Environment) =>
    env.isInstalled && !isInProgress(env);
export const isOnlyAvailable = (env: Environment) =>
    !isInstalled(env) && !isInProgress(env);
export const canBeDownloaded = (env: Environment | undefined) =>
    env?.toolchains != null;

export const version = (env: Environment) => env.version;
export const toolchainDir = (env: Environment) => env.toolchainDir;

export const progress = (env: Environment) => env.progress;

export const progressLabel = (env: Environment) => {
    if (env.type === 'legacy') {
        return isInProgress(env) && env.progress !== undefined
            ? `${env.stage || ''}${
                  env.progress % 100 !== 0 ? ` ${env.progress}%` : ''
              }`
            : '';
    }

    if (env.type === 'nrfUtil') {
        return Object.values(env.tasks)
            .map(taskEvents => describeTask(taskEvents))
            .join(', ');
    }
};

function describeTask(taskEvents: TaskEvent[]): string {
    const { task } = taskEvents[0].data;
    const lastTask = taskEvents.slice(-1)[0];
    if (lastTask.type === 'task_end') {
        return `${task.description} ${lastTask.data.message}`;
    }
    return task.description;
}
