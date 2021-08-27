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

import React from 'react';
import { useDispatch } from 'react-redux';

import { showReduxConfirmDialogAction } from '../../ReduxConfirmDialog/reduxConfirmDialogReducer';
import {
    getVsCodeStatus,
    installExtensions,
    listInstalledExtensions,
    VsCodeStatus,
} from '../vscode';
import Button from './Button';
import environmentPropType from './environmentPropType';
import { isInProgress } from './environmentReducer';

function cb(cancelled) {
    return dispatch => {
        if (!cancelled) {
            console.log('Confirmed');
            dispatch(showVsCodeDialog());
        }
    };
}

function installVsCodeExtensions(cancelled) {
    return dispatch => {
        if (cancelled) return;

        installExtensions();

        dispatch(
            showReduxConfirmDialogAction({
                title: 'Opening VS Code',
                content: 'All extensions installed succesfully.',
                callback: ret => openVsCode(ret),
                confirmLabel: 'Open VS Code',
                cancelLabel: 'Cancel',
            })
        );
    };
}

function showInstallVsCodeExtensions() {
    return dispatch => {
        dispatch(
            showReduxConfirmDialogAction({
                title: 'Opening VS Code',
                content: `For developing nRF applications with VS Code we recommend using the following extensions:\n\n${listInstalledExtensions()
                    .toString()
                    .replace(/,/g, '\n\n')}`,
                callback: ret => dispatch(installVsCodeExtensions(ret)),
                confirmLabel: 'Install all missing extensions',
                cancelLabel: 'Cancel',
                onOptional: ret => openVsCode(ret),
                optionalLabel: 'Open anyway',
            })
        );
    };
}

function openVsCode(cancelled) {
    if (cancelled) return;

    console.log('Open VS Code');
}

function showInstallVsCode() {
    return dispatch => {
        let installLink;
        if (process.platform === 'win32') {
            installLink = 'https://code.visualstudio.com/docs/setup/windows';
        } else if (process.platform === 'darwin') {
            installLink = 'https://code.visualstudio.com/docs/setup/mac';
        } else if (process.platform === 'linux') {
            installLink = 'https://code.visualstudio.com/docs/setup/linux';
        }
        dispatch(
            showReduxConfirmDialogAction({
                title: 'Opening VS Code',
                content: `VS Code was not detected on your system.\n\nInstall VS Code and try again: \n${installLink}\n\n ${
                    process.platform === 'darwin'
                        ? 'On macOS please make sure that you also follow the instructions for *Launching from the command line*: https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line'
                        : ''
                }`,
                callback: ret => dispatch(cb(ret)),
                confirmLabel: 'OK, I installed VS Code',
                cancelLabel: 'Cancel',
            })
        );
    };
}

function showVsCodeDialog() {
    return dispatch => {
        const ret = getVsCodeStatus();
        if (ret === VsCodeStatus.NOT_INSTALLED) dispatch(showInstallVsCode());
        else if (ret === VsCodeStatus.EXTENSIONS_MISSING)
            dispatch(showInstallVsCodeExtensions());
        else if (ret === VsCodeStatus.INSTALLED) openVsCode();
    };
}

const OpenVsCode = ({ environment }) => {
    const dispatch = useDispatch();
    return (
        <Button
            icon="x-mdi-rocket"
            onClick={() => dispatch(showVsCodeDialog())}
            label="Open VS Code"
            title="Open Visual Studio Code"
            disabled={isInProgress(environment)}
            variant="primary"
        />
    );
};

OpenVsCode.propTypes = { environment: environmentPropType.isRequired };

export default OpenVsCode;
