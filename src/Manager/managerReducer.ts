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

import { AnyAction } from 'redux';
import semver from 'semver';

import {
    persistedShowMaster,
    setPersistedShowMaster,
} from '../persistentStore';
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
} from './Environment/environmentReducer';

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

const SELECT_ENVIRONMENT = 'SELECT_ENVIRONMENT';
export const selectEnvironment = (selectedVersion: string) => ({
    type: SELECT_ENVIRONMENT,
    selectedVersion,
});

const ADD_ENVIRONMENT = 'ADD_ENVIRONMENT';
export const addEnvironment = (environment: Environment) => ({
    type: ADD_ENVIRONMENT,
    environment,
});
export const addLocallyExistingEnvironment = (
    version: string,
    toolchainDir: string,
    isWestPresent: boolean,
    isInstalled = true
) => ({
    type: ADD_ENVIRONMENT,
    environment: {
        version,
        toolchainDir,
        isWestPresent,
        isInstalled,
    },
});

const CLEAR_ENVIRONMENTS = 'CLEAR_ENVIRONMENTS';
export const clearEnvironments = () => ({
    type: CLEAR_ENVIRONMENTS,
});

const SHOW_CONFIRM_REMOVE_DIALOG = 'SHOW_CONFIRM_REMOVE_DIALOG';
export const showConfirmRemoveDialog = (version: string) => ({
    type: SHOW_CONFIRM_REMOVE_DIALOG,
    version,
});

const HIDE_CONFIRM_REMOVE_DIALOG = 'HIDE_CONFIRM_REMOVE_DIALOG';
export const hideConfirmRemoveDialog = () => ({
    type: HIDE_CONFIRM_REMOVE_DIALOG,
});

const SHOW_INSTALL_PACKAGE_DIALOG = 'SHOW_INSTALL_PACKAGE_DIALOG';
export const showInstallPackageDialog = (dndPackage: string | null = null) => ({
    type: SHOW_INSTALL_PACKAGE_DIALOG,
    dndPackage,
});

const HIDE_INSTALL_PACKAGE_DIALOG = 'HIDE_INSTALL_PACKAGE_DIALOG';
export const hideInstallPackageDialog = () => ({
    type: HIDE_INSTALL_PACKAGE_DIALOG,
});

const SHOW_MASTER = 'SHOW_MASTER';
export const showMasterEnvironment = (visible: boolean) => ({
    type: SHOW_MASTER,
    show: !!visible,
});

const SHOW_FIRST_STEPS = 'SHOW_FIRST_STEPS';
export const showFirstSteps = () => ({
    type: SHOW_FIRST_STEPS,
});

const HIDE_FIRST_STEPS = 'HIDE_FIRST_STEPS';
export const hideFirstSteps = () => ({
    type: HIDE_FIRST_STEPS,
});

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

const managerReducer = (state: Manager, action: AnyAction) => {
    switch (action.type) {
        case ADD_ENVIRONMENT:
            return {
                ...state,
                environments: append(state.environments, action.environment),
            };
        case CLEAR_ENVIRONMENTS:
            return { ...state, environments: {} };
        case REMOVE_ENVIRONMENT:
            return {
                ...state,
                environments: remove(state.environments, action.version),
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
        case SHOW_INSTALL_PACKAGE_DIALOG:
            return {
                ...state,
                dndPackage: action.dndPackage,
                isInstallPackageDialogVisible: true,
            };
        case HIDE_INSTALL_PACKAGE_DIALOG:
            return {
                ...state,
                dndPackage: null,
                isInstallPackageDialogVisible: false,
            };
        case SHOW_MASTER:
            setPersistedShowMaster(!!action.show);
            return { ...state, isMasterVisible: !!action.show };
        case SELECT_ENVIRONMENT:
            return { ...state, selectedVersion: action.selectedVersion };
        case SHOW_FIRST_STEPS:
            return { ...state, isShowingFirstSteps: true };
        case HIDE_FIRST_STEPS:
            return { ...state, isShowingFirstSteps: false };
        default:
            return state;
    }
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
    isMasterVisible: persistedShowMaster(),
    isShowingFirstSteps: false,
    dndPackage: null,
    versionToRemove: '',
});

export default (state = initialState(), action: AnyAction) => {
    const stateAfterEnvironmentReducer = maybeCallEnvironmentReducer(
        state,
        action
    );
    return managerReducer(stateAfterEnvironmentReducer, action);
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

export const isMasterVisible = ({ app }: RootState) =>
    app.manager.isMasterVisible;

export const dndPackage = ({ app }: RootState) => app.manager.dndPackage;

export const isShowingFirstSteps = ({ app }: RootState) =>
    app.manager.isShowingFirstSteps;
