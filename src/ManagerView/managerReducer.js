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

import {
    ENVIRONMENT_LIST_UPDATE,
    ENVIRONMENT_IN_PROCESS,
    ENVIRONMENT_LIST_CLEAR,
    TOOLCHAIN_UPDATE,
    ENVIRONMENT_REMOVE,
    CONFIRM_INSTALL_DIALOG_SHOW,
    CONFIRM_INSTALL_DIALOG_HIDE,
    CONFIRM_REMOVE_DIALOG_SHOW,
    CONFIRM_REMOVE_DIALOG_HIDE,
    SELECT_ENVIRONMENT,
} from './managerActions';

const InitialState = {
    environmentList: [],
    isInProcess: false,
    isInstallDirDialogVisible: false,
    isRemoveDirDialogVisible: false,
    environmentVersionToInstall: null,
    environmentVersionToRemove: null,
    selectedVersion: null,
};

const reducer = (state = InitialState, action) => {
    switch (action.type) {
        case ENVIRONMENT_LIST_UPDATE:
            return {
                ...state,
                environmentList: action.environmentList,
            };
        case ENVIRONMENT_IN_PROCESS: {
            const { version } = action;
            const { environmentList } = state;
            const envIndex = environmentList.findIndex(v => v.version === version);
            if (envIndex < 0) {
                throw new Error(`No environment version found for ${version}`);
            }
            environmentList[envIndex] = {
                ...environmentList[envIndex],
                isInProcess: action.isInProcess,
            };
            return {
                ...state,
                environmentList: [...environmentList],
                isInProcess: action.isInProcess,
            };
        }
        case ENVIRONMENT_LIST_CLEAR:
            return {
                ...state,
                environmentList: [],
            };
        case TOOLCHAIN_UPDATE: {
            const { toolchain, environmentVersion } = action;
            if (!toolchain) {
                throw new Error('No toolchain state provided');
            }

            const { environmentList } = state;
            const envIndex = environmentList.findIndex(v => v.version === environmentVersion);
            if (envIndex < 0) {
                throw new Error(`No environment version found for ${environmentVersion}`);
            }

            const toolchainList = environmentList[envIndex].toolchainList || [];
            const toolchainIndex = toolchainList.findIndex(v => (v.version === toolchain.version));
            if (toolchainIndex < 0) {
                toolchainList.push(toolchain);
            } else {
                toolchainList[toolchainIndex] = {
                    ...toolchainList[toolchainIndex],
                    ...toolchain,
                };
            }

            environmentList[envIndex] = {
                ...environmentList[envIndex],
                toolchainList,
            };

            return {
                ...state,
                environmentList: [...environmentList],
            };
        }
        case ENVIRONMENT_REMOVE: {
            const { version } = action;
            const { environmentList } = state;
            const envIndex = environmentList.findIndex(v => v.version === version);
            if (envIndex < 0) {
                throw new Error(`No environment version found for ${version}`);
            }
            environmentList.splice(envIndex, 1);
            return {
                ...state,
                environmentList: [...environmentList],
            };
        }
        case CONFIRM_INSTALL_DIALOG_SHOW: {
            return {
                ...state,
                isInstallDirDialogVisible: true,
                environmentVersionToInstall: action.version,
            };
        }
        case CONFIRM_INSTALL_DIALOG_HIDE: {
            return {
                ...state,
                isInstallDirDialogVisible: false,
                environmentVersionToInstall: null,
            };
        }
        case CONFIRM_REMOVE_DIALOG_SHOW: {
            return {
                ...state,
                isRemoveDirDialogVisible: true,
                environmentVersionToRemove: action.version,
            };
        }
        case CONFIRM_REMOVE_DIALOG_HIDE: {
            return {
                ...state,
                isRemoveDirDialogVisible: false,
                environmentVersionToRemove: null,
            };
        }
        case SELECT_ENVIRONMENT: {
            return {
                ...state,
                selectedVersion: action.selectedVersion,
            };
        }
        default:
            return state;
    }
};

export default reducer;
