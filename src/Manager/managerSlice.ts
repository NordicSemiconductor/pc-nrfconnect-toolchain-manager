/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import type {
    Environment,
    Environments,
    Manager,
    RootState,
    Toolchain,
} from '../state';
import environmentReducer, {
    canBeDownloaded,
    isInProgress,
    REMOVE_ENVIRONMENT,
    removeEnvironmentReducer,
} from './Environment/environmentReducer';
import { sortedByVersion } from './versionFilter';

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
                type: 'legacy' | 'nrfUtil';
                version: string;
                toolchainDir: string;
                isWestPresent: boolean;
                isInstalled: boolean;
            }>
        ) => {
            const environment: Environment = {
                ...action.payload,
                toolchains: [],
                tasks: {},
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

// eslint-disable-next-line default-param-last -- Because this is a reducer, where this is the required signature
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

export const isAnyToolchainInProgress = ({ app }: RootState) =>
    Object.values(app.manager.environments).some(e => isInProgress(e));
