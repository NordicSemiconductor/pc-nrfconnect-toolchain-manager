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

import { toolchainIndexUrl, setToolchainIndexUrl } from '../persistentStore';

const SET_TOOLCHAIN_SOURCE = 'SET_TOOLCHAIN_SOURCE';
export const setToolchainSource = toolchainRootUrl => ({
    type: SET_TOOLCHAIN_SOURCE,
    toolchainRootUrl,
});

const SHOW_SET_TOOLCHAIN_SOURCE_DIALOG = 'SHOW_SET_TOOLCHAIN_SOURCE_DIALOG';
export const showSetToolchainSourceDialog = () => ({
    type: SHOW_SET_TOOLCHAIN_SOURCE_DIALOG,
    isDialogVisible: true,
});

const HIDE_SET_TOOLCHAIN_SOURCE_DIALOG = 'HIDE_SET_TOOLCHAIN_SOURCE_DIALOG';
export const hideSetToolchainSourceDialog = () => ({
    type: HIDE_SET_TOOLCHAIN_SOURCE_DIALOG,
    isDialogVisible: false,
});

const initialState = {
    toolchainRootUrl: toolchainIndexUrl(),
    isDialogVisible: false,
};

export default (state = initialState, { type, ...action }) => {
    switch (type) {
        case SET_TOOLCHAIN_SOURCE:
            setToolchainIndexUrl(action.toolchainRootUrl);
        case SHOW_SET_TOOLCHAIN_SOURCE_DIALOG: // eslint-disable-line no-fallthrough
        case HIDE_SET_TOOLCHAIN_SOURCE_DIALOG:
            return {
                ...state,
                ...action,
            };
        default:
            return state;
    }
};

export const toolchainRootUrl = ({ app }) => app.toolchainSource.toolchainRootUrl;
export const isDialogVisible = ({ app }) => app.toolchainSource.isDialogVisible;
