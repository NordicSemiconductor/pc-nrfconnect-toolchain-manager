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

import semver from 'semver';

const compareBy = prop => (a, b) => {
    try {
        return -semver.compare(a[prop], b[prop]);
    } catch (_) {
        switch (true) {
            case (a[prop] < b[prop]): return -1;
            case (a[prop] > b[prop]): return 1;
            default: return 0;
        }
    }
};

const SELECT_ENVIRONMENT = 'SELECT_ENVIRONMENT';
export const selectEnvironment = selectedVersion => ({
    type: SELECT_ENVIRONMENT,
    selectedVersion,
});

const ADD_ENVIRONMENT = 'ADD_ENVIRONMENT';
export const addEnvironment = environment => ({
    type: ADD_ENVIRONMENT,
    environment,
});

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
export const startCloning = version => ({ type: START_CLONING, version });

const FINISH_CLONING = 'FINISH_CLONING';
export const finishCloning = version => ({ type: FINISH_CLONING, version });

const START_REMOVING = 'START_REMOVING';
export const startRemoving = version => ({ type: START_REMOVING, version });

const FINISH_REMOVING = 'FINISH_REMOVING';
export const finishRemoving = version => ({ type: FINISH_REMOVING, version });

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

const REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT';
export const removeEnvironment = version => ({
    type: REMOVE_ENVIRONMENT,
    version,
});

const CLEAR_ENVIRONMENTS = 'CLEAR_ENVIRONMENTS';
export const clearEnvironments = () => ({
    type: CLEAR_ENVIRONMENTS,
});

const SET_VERSION_TO_INSTALL = 'SET_VERSION_TO_INSTALL';
export const setVersionToInstall = version => ({
    type: SET_VERSION_TO_INSTALL,
    version,
});

const SHOW_CONFIRM_REMOVE_DIALOG = 'SHOW_CONFIRM_REMOVE_DIALOG';
export const showConfirmRemoveDialog = version => ({
    type: SHOW_CONFIRM_REMOVE_DIALOG,
    version,
});

const HIDE_CONFIRM_REMOVE_DIALOG = 'HIDE_CONFIRM_REMOVE_DIALOG';
export const hideConfirmRemoveDialog = () => ({
    type: HIDE_CONFIRM_REMOVE_DIALOG,
});

const InitialState = {
    environments: {},
    isRemoveDirDialogVisible: false,
    versionToInstall: null,
    versionToRemove: null,
    selectedVersion: null,
};

const addSingleEnvironment = (environments, environment) => ({
    ...environments,
    [environment.version]: {
        ...environments[environment.version] || {},
        ...environment,
    },
});

const updateSingleEnvironment = (environments, version, environmentChange) => {
    if (environments[version] == null) {
        console.error(`No environment version found for ${version}`);
        return environments;
    }

    return {
        ...environments,
        [version]: {
            ...environments[version],
            ...environmentChange,
        },
    };
};

const removeSingleEnvironment = (environments, version) => {
    if (environments[version] == null) {
        console.error(`No environment version found for ${version}`);
        return environments;
    }

    const newEnvironments = { ...environments };
    const environmentIsOnlyLocal = !environments[version].toolchains;
    if (environmentIsOnlyLocal) {
        delete newEnvironments[version];
    } else {
        newEnvironments[version] = {
            ...newEnvironments[version],
            toolchainDir: null,
        };
    }

    return newEnvironments;
};

const reducer = (state = InitialState, action) => {
    switch (action.type) {
        case ADD_ENVIRONMENT:
            return {
                ...state,
                environments: addSingleEnvironment(state.environments, action.environment),
            };
        case START_ENVIRONMENT_IN_PROCESS:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { isInProcess: true },
                ),
            };
        case FINISH_ENVIRONMENT_IN_PROCESS:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { isInProcess: false },
                ),
            };
        case START_CLONING:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { isCloning: true },
                ),
            };
        case FINISH_CLONING:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { isCloning: false },
                ),
            };
        case START_REMOVING:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { isRemoving: true },
                ),
            };
        case FINISH_REMOVING:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { isRemoving: false },
                ),
            };
        case SET_ENVIRONMENT_PROGRESS:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { progress: action.progress },
                ),
            };
        case SET_TOOLCHAIN_DIR:
            return {
                ...state,
                environments: updateSingleEnvironment(
                    state.environments,
                    action.version,
                    { toolchainDir: action.toolchainDir },
                ),
            };
        case CLEAR_ENVIRONMENTS:
            return {
                ...state,
                environments: {},
            };
        case REMOVE_ENVIRONMENT:
            return {
                ...state,
                environments: removeSingleEnvironment(state.environments, action.version),
            };
        case SET_VERSION_TO_INSTALL:
            return {
                ...state,
                versionToInstall: action.version,
            };
        case SHOW_CONFIRM_REMOVE_DIALOG:
            return {
                ...state,
                isRemoveDirDialogVisible: true,
                versionToRemove: action.version,
            };
        case HIDE_CONFIRM_REMOVE_DIALOG:
            return {
                ...state,
                isRemoveDirDialogVisible: false,
                versionToRemove: null,
            };
        case SELECT_ENVIRONMENT:
            return {
                ...state,
                selectedVersion: action.selectedVersion,
            };
        default:
            return state;
    }
};

export default reducer;

export const getLatestToolchain = toolchains => [...toolchains].sort(compareBy('version')).pop();

export const isRemoveDirDialogVisible = state => state.app.manager.isRemoveDirDialogVisible;

export const environmentToRemove = state => (
    state.app.manager.environments[state.app.manager.versionToRemove]);
export const environmentToInstall = state => (
    state.app.manager.environments[state.app.manager.versionToInstall]);

export const selectedVersion = state => state.app.manager.selectedVersion;

export const environmentsByVersion = state => [...Object.values(state.app.manager.environments).sort(compareBy('version'))];
