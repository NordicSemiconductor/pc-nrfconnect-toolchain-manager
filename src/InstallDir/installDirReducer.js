/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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

import { persistedInstallDir, setPersistedInstallDir } from '../persistentStore';

const CONFIRM_DIR = Symbol('Confirm the install directory');
const SET_DIR = Symbol('Set the install directory');

const SET_INSTALL_DIR = 'SET_INSTALL_DIR';
export const setInstallDir = dir => ({
    type: SET_INSTALL_DIR,
    dir,
});

const SHOW_CONFIRM_INSTALL_DIR_DIALOG = 'SHOW_CONFIRM_INSTALL_DIR_DIALOG';
export const showConfirmInstallDirDialog = () => ({
    type: SHOW_CONFIRM_INSTALL_DIR_DIALOG,
});

const SHOW_SET_INSTALL_DIR_DIALOG = 'SHOW_SET_INSTALL_DIR_DIALOG';
export const showSetInstallDirDialog = () => ({
    type: SHOW_SET_INSTALL_DIR_DIALOG,
});

const HIDE_INSTALL_DIR_DIALOG = 'HIDE_INSTALL_DIR_DIALOG';
export const hideInstallDirDialog = () => ({
    type: HIDE_INSTALL_DIR_DIALOG,
});

const initialState = {
    currentDir: persistedInstallDir(),
    isDialogVisible: false,
    dialogFlavour: null,
};

export default (state = initialState, action) => {
    switch (action.type) {
        case SET_INSTALL_DIR:
            setPersistedInstallDir(action.dir);
            return {
                ...state,
                currentDir: action.dir,
            };
        case SHOW_CONFIRM_INSTALL_DIR_DIALOG:
            return {
                ...state,
                isDialogVisible: true,
                dialogFlavour: CONFIRM_DIR,
            };
        case SHOW_SET_INSTALL_DIR_DIALOG:
            return {
                ...state,
                isDialogVisible: true,
                dialogFlavour: SET_DIR,
            };
        case HIDE_INSTALL_DIR_DIALOG:
            return {
                ...state,
                isDialogVisible: false,
            };
        default:
            return state;
    }
};

export const currentInstallDir = state => state.app.installDir.currentDir;
export const isDialogVisible = state => state.app.installDir.isDialogVisible;
export const isConfirmDirFlavour = state => state.app.installDir.dialogFlavour === CONFIRM_DIR;
