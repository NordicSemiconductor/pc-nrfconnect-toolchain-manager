/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { AnyAction } from 'redux';

import { Environment } from '../../state';

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
export const removeEnvironment = (version: string) => ({
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
export const canBeDownloaded = (env: Environment) => env.toolchains != null;

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
