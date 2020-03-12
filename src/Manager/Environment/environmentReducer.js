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

const START_INSTALL_TOOLCHAIN = 'START_INSTALL_TOOLCHAIN';
export const startInstallToolchain = version => ({
    type: START_INSTALL_TOOLCHAIN,
    version,
});

const FINISH_INSTALL_TOOLCHAIN = 'FINISH_INSTALL_TOOLCHAIN';
export const finishInstallToolchain = (version, toolchainDir) => ({
    type: FINISH_INSTALL_TOOLCHAIN,
    version,
    toolchainDir,
});

const START_CLONING_SDK = 'START_CLONING_SDK';
export const startCloningSdk = version => ({
    type: START_CLONING_SDK,
    version,
});

const FINISH_CLONING_SDK = 'FINISH_CLONING_SDK';
export const finishCloningSdk = version => ({
    type: FINISH_CLONING_SDK,
    version,
});

const START_REMOVING = 'START_REMOVING';
export const startRemoving = version => ({
    type: START_REMOVING,
    version,
});

const FINISH_REMOVING = 'FINISH_REMOVING';
export const finishRemoving = version => ({
    type: FINISH_REMOVING,
    version,
});

const SET_PROGRESS = 'SET_PROGRESS';
export const setProgress = (version, currentValue, maxValue, half) => ({
    type: SET_PROGRESS,
    version,
    progress: Math.round(currentValue / maxValue * 50) + (half === 2 ? 50 : 0),
});

export const REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT';
export const removeEnvironment = version => ({
    type: REMOVE_ENVIRONMENT,
    version,
});

export default (state, action) => {
    switch (action.type) {
        case START_INSTALL_TOOLCHAIN: return { ...state, isInstallingToolchain: true };
        case FINISH_INSTALL_TOOLCHAIN: return {
            ...state,
            isInstallingToolchain: false,
            toolchainDir: action.toolchainDir,
            isInstalled: true,
        };
        case START_CLONING_SDK: return { ...state, isCloningSdk: true };
        case FINISH_CLONING_SDK: return { ...state, isCloningSdk: false };
        case START_REMOVING: return { ...state, isRemoving: true };
        case FINISH_REMOVING: return { ...state, isRemoving: false };
        case SET_PROGRESS: return { ...state, progress: action.progress };
        case REMOVE_ENVIRONMENT: return { ...state, isInstalled: false };
        default: return state;
    }
};

export const isInstallingToolchain = env => env.isInstallingToolchain;
export const isCloningSdk = env => env.isCloningSdk;
export const isRemoving = env => env.isRemoving;
export const isInProgress = env => isInstallingToolchain(env)
    || isCloningSdk(env)
    || isRemoving(env);

export const isInstalled = env => env.isInstalled && !isInProgress(env);
export const isOnlyAvailable = env => !isInstalled(env) && !isInProgress(env);
export const canBeDownloaded = env => env.toolchains != null;

export const version = env => env.version;
export const toolchainDir = env => env.toolchainDir;
export const canBeOpenedInSegger = env => env.isWestPresent;

export const progress = env => {
    switch (true) {
        case isRemoving(env): return 0;
        case isCloningSdk(env): return 100;
        case isInstalled(env): return 100;
        default: return env.progress || 0;
    }
};

export const progressLabel = env => {
    switch (true) {
        case isInstallingToolchain(env): return `Installing ${progress(env)}%`;
        case isCloningSdk(env): return 'Cloning SDK... please wait until the terminal window is closed!';
        case isRemoving(env): return 'Removing...';
        default: return '';
    }
};
