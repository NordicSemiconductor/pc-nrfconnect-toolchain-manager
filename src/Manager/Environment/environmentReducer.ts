/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AnyAction } from 'redux';

import type { Environment } from '../../state';

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

export default (state: Environment, { type, ...action }: AnyAction) => {
    switch (type) {
        case START_INSTALL_TOOLCHAIN:
            return {
                ...state,
                isInstallingToolchain: true,
            };
        case FINISH_INSTALL_TOOLCHAIN:
            return {
                ...state,
                stage: null,
                isInstallingToolchain: false,
                toolchainDir: action.toolchainDir,
                isInstalled: true,
            };
        case START_CLONING_SDK:
            return { ...state, isCloningSdk: true };
        case FINISH_CLONING_SDK:
            return {
                ...state,
                isCloningSdk: false,
                isWestPresent: action.isWestPresent,
            };
        case START_REMOVING:
            return {
                ...state,
                stage: 'Removing...',
                isRemoving: true,
                progress: 100,
            };
        case FINISH_REMOVING:
            return { ...state, stage: null, isRemoving: false };
        case SET_PROGRESS:
            return { ...state, ...action };
        case REMOVE_ENVIRONMENT:
            return { ...state, isInstalled: false, isWestPresent: false };
        default:
            return state;
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
export const canBeOpenedInSegger = (env: Environment) => env.isWestPresent;

export const progress = (env: Environment) => env.progress;

export const progressLabel = (env: Environment) =>
    isInProgress(env) && env.progress !== undefined
        ? `${env.stage || ''}${
              env.progress % 100 !== 0 ? ` ${env.progress}%` : ''
          }`
        : '';
