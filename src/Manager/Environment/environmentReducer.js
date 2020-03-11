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

const START_ENVIRONMENT_IN_PROCESS = 'START_ENVIRONMENT_IN_PROCESS';
export const startEnvironmentInProcess = version => ({
    type: START_ENVIRONMENT_IN_PROCESS,
    version,
});

const FINISH_ENVIRONMENT_IN_PROCESS = 'FINISH_ENVIRONMENT_IN_PROCESS';
export const finishEnvironmentInProcess = version => ({
    type: FINISH_ENVIRONMENT_IN_PROCESS,
    version,
});

const START_CLONING = 'START_CLONING';
export const startCloning = version => ({
    type: START_CLONING,
    version,
});

const FINISH_CLONING = 'FINISH_CLONING';
export const finishCloning = version => ({
    type: FINISH_CLONING,
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

const SET_TOOLCHAIN_DIR = 'SET_TOOLCHAIN_DIR';
export const setToolchainDir = (version, toolchainDir) => ({
    type: SET_TOOLCHAIN_DIR,
    version,
    toolchainDir,
});

const SET_ENVIRONMENT_PROGRESS = 'SET_ENVIRONMENT_PROGRESS';
export const setEnvironmentProgress = (version, progress) => ({
    type: SET_ENVIRONMENT_PROGRESS,
    version,
    progress,
});

export const REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT';
export const removeEnvironment = version => ({
    type: REMOVE_ENVIRONMENT,
    version,
});

export default (state, action) => {
    switch (action.type) {
        case START_ENVIRONMENT_IN_PROCESS: return { ...state, isInProcess: true };
        case FINISH_ENVIRONMENT_IN_PROCESS: return { ...state, isInProcess: false };
        case START_CLONING: return { ...state, isCloning: true };
        case FINISH_CLONING: return { ...state, isCloning: false };
        case START_REMOVING: return { ...state, isRemoving: true };
        case FINISH_REMOVING: return { ...state, isRemoving: false };
        case SET_ENVIRONMENT_PROGRESS: return { ...state, progress: action.progress };
        case SET_TOOLCHAIN_DIR: return { ...state, toolchainDir: action.toolchainDir };
        case REMOVE_ENVIRONMENT: return { ...state, toolchainDir: null };
        default: return state;
    }
};

export const isAvailableForDownload = environment => environment.toolchains != null;
