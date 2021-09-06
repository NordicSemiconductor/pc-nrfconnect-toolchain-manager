/* Copyright (c) 2015 - 2020, Nordic Semiconductor ASA
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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import semver from 'semver';

import {
    Environment,
    Environments,
    Manager,
    RootState,
    Toolchain,
} from '../state';
import environmentReducer, {
    canBeDownloaded,
    REMOVE_ENVIRONMENT,
    removeEnvironmentReducer,
} from './Environment/environmentReducer';

const append = (environments: Environments, environment: Environment) => ({
    ...environments,
    [environment.version]: {
        ...(environments[environment.version] || {}),
        ...environment,
    },
});

const remove = (environments: Environments, version: string) => {
    if (environments[version] == null) {
        console.error(`No environment version found for ${version}`);
        return environments;
    }

    // If it still can be downloaded, we want to keep it in the list
    if (canBeDownloaded(environments[version])) {
        return environments;
    }

    const newEnvironments = { ...environments };
    delete newEnvironments[version];

    return newEnvironments;
};

const maybeCallEnvironmentReducer = (state: Manager, action: AnyAction) => {
    if (action.version == null || state.environments[action.version] == null) {
        return state;
    }

    return {
        ...state,
        environments: {
            ...state.environments,
            [action.version]: environmentReducer(
                state.environments[action.version],
                action
            ),
        },
    };
};

const initialState = (): Manager => ({
    environments: {},
    isRemoveDirDialogVisible: false,
    isInstallPackageDialogVisible: false,
    isShowingFirstSteps: false,
    dndPackage: null,
    versionToRemove: '',
});

const managerSlice = createSlice({
    name: 'manager',
    initialState: initialState(),
    reducers: {
        clearEnvironments: state => {
            state.environments = {};
        },
        showConfirmRemoveDialog: (state, action: PayloadAction<string>) => {
            state.isRemoveDirDialogVisible = true;
            state.versionToRemove = action.payload;
        },
        hideConfirmRemoveDialog: state => {
            state.isRemoveDirDialogVisible = false;
            state.versionToRemove = '';
        },
        showInstallPackageDialog: (state, action: PayloadAction<string>) => {
            state.dndPackage = action.payload;
            state.isInstallPackageDialogVisible = true;
        },
        hideInstallPackageDialog: state => {
            state.dndPackage = null;
            state.isInstallPackageDialogVisible = false;
        },
        showFirstSteps: state => {
            state.isShowingFirstSteps = true;
        },
        hideFirstSteps: state => {
            state.isShowingFirstSteps = false;
        },
        selectEnvironment: (state, action) => {
            state.selectedVersion = action.payload;
        },
        addEnvironment: (state, action: PayloadAction<Environment>) => {
            state.environments = append(state.environments, action.payload);
        },
        addLocallyExistingEnvironment: (
            state,
            action: PayloadAction<{
                version: string;
                toolchainDir: string;
                isWestPresent: boolean;
                isInstalled: boolean;
            }>
        ) => {
            const environment: Environment = {
                ...action.payload,
                toolchains: [],
            };
            state.environments = append(state.environments, environment);
        },
    },
    extraReducers: {
        [REMOVE_ENVIRONMENT]: (
            state,
            action: ReturnType<typeof removeEnvironmentReducer>
        ) => {
            state.environments = remove(state.environments, action.version);
        },
    },
});

export const {
    actions: {
        clearEnvironments,
        hideConfirmRemoveDialog,
        hideFirstSteps,
        hideInstallPackageDialog,
        showConfirmRemoveDialog,
        showFirstSteps,
        showInstallPackageDialog,
        selectEnvironment,
        addEnvironment,
        addLocallyExistingEnvironment,
    },
} = managerSlice;

export default (state = initialState(), action: AnyAction) => {
    const stateAfterEnvironmentReducer = maybeCallEnvironmentReducer(
        state,
        action
    );
    return managerSlice.reducer(stateAfterEnvironmentReducer, action);
};

export const getLatestToolchain = (toolchains: Toolchain[]) =>
    sortedByVersion(toolchains).pop();

export const isRemoveDirDialogVisible = ({ app }: RootState) =>
    app.manager.isRemoveDirDialogVisible;

export const isInstallPackageDialogVisible = ({ app }: RootState) =>
    app.manager.isInstallPackageDialogVisible;

export const getEnvironment = ({ app }: RootState, version: string) =>
    app.manager.environments[version];

export const environmentToRemove = (state: RootState) =>
    getEnvironment(state, state.app.manager.versionToRemove);

export const selectedVersion = ({ app }: RootState) =>
    app.manager.selectedVersion;

export const environmentsByVersion = ({ app }: RootState) =>
    sortedByVersion(Object.values(app.manager.environments));

export const dndPackage = ({ app }: RootState) => app.manager.dndPackage;

export const isShowingFirstSteps = ({ app }: RootState) =>
    app.manager.isShowingFirstSteps;

const byVersion = (a: { version: string }, b: { version: string }) => {
    try {
        return -semver.compare(a.version, b.version);
    } catch (_) {
        switch (true) {
            case a.version < b.version:
                return -1;
            case a.version > b.version:
                return 1;
            default:
                return 0;
        }
    }
};

const sortedByVersion = <T extends { version: string }>(list: T[]): T[] =>
    [...list].sort(byVersion);
