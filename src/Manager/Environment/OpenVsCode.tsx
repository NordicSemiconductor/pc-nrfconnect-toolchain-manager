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

import checkInstalled from '../../../resources/check-circle-installed.svg';
import checkNotInstalled from '../../../resources/check-circle-not-installed.svg';
import { showReduxConfirmDialogAction } from '../../ReduxConfirmDialog/reduxConfirmDialogReducer';
import { Dispatch, Environment } from '../../state';
import {
    getVsCodeStatus,
    installExtensions,
    listInstalledExtensions,
    openVsCode,
    RECOMENDED_EXTENSIONS,
    REQUIRED_EXTENSIONS,
    VsCodeStatus,
} from '../vscode';
import Button from './Button';
import environmentPropType from './environmentPropType';
import { isInProgress } from './environmentReducer';

function cancelCheckCallback(
    cancelled: boolean,
    func: (dispatch: Dispatch) => void
) {
    return (dispatch: Dispatch) => {
        if (!cancelled) dispatch(func);
    };
}

function installVsCodeExtensions(dispatch: Dispatch) {
    const status = installExtensions();
    const failed = status.filter(extension => extension.success);
    const succeded = failed.length === 0;

    const content = succeded
        ? 'All extensions installed succesfully.'
        : `Not all extensions installed. Missing ${failed
              .map(f => f.identifier)
              .join(', ')}.`;

    const confirmLabel = succeded ? 'Open VS Code' : 'Open VS Code anyway';

    dispatch(
        showReduxConfirmDialogAction({
            title: 'Opening VS Code',
            content,
            callback: cancelled =>
                dispatch(cancelCheckCallback(cancelled, openVsCode)),
            confirmLabel,
            cancelLabel: 'Cancel',
        })
    );
}

function extensionsToString(expected: string[], installed?: string[]) {
    return expected
        .map(e => {
            if (installed?.includes(e))
                return `![Installed](${checkInstalled}) ${e}`;
            return `![Not installed](${checkNotInstalled}) ${e}`;
        })
        .join('\n\n');
}

function showInstallVsCodeExtensions() {
    return (dispatch: Dispatch) => {
        const extensions = listInstalledExtensions();

        dispatch(
            showReduxConfirmDialogAction({
                title: 'Opening VS Code',
                content: `For developing nRF applications with VS Code we recommend using the following extensions:\n\n**Required**\n\n${extensionsToString(
                    REQUIRED_EXTENSIONS,
                    extensions
                )}\n\n**Recommended**\n\n${extensionsToString(
                    RECOMENDED_EXTENSIONS,
                    extensions
                )}`,
                callback: cancelled =>
                    dispatch(
                        cancelCheckCallback(cancelled, installVsCodeExtensions)
                    ),
                confirmLabel: 'Install all missing extensions',
                cancelLabel: 'Cancel',
                onOptional: cancelled => {
                    if (!cancelled) openVsCode();
                },
                optionalLabel: 'Open anyway',
            })
        );
    };
}

function showInstallVsCode() {
    return (dispatch: Dispatch) => {
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
                content: `VS Code was not detected on your system.\n\n[Install VS Code](${installLink}) and try again.\n\n ${
                    process.platform === 'darwin'
                        ? 'On macOS please make sure that you also follow the instructions for [Launching from the command line](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line).'
                        : ''
                }`,
                callback: cancelled =>
                    dispatch(cancelCheckCallback(cancelled, showVsCodeDialog)),
                confirmLabel: 'OK, I installed VS Code',
                cancelLabel: 'Cancel',
            })
        );
    };
}

function showVsCodeDialog() {
    return (dispatch: Dispatch) => {
        const status = getVsCodeStatus();

        if (status === VsCodeStatus.NOT_INSTALLED)
            dispatch(showInstallVsCode());
        else if (status === VsCodeStatus.EXTENSIONS_MISSING)
            dispatch(showInstallVsCodeExtensions());
        else if (status === VsCodeStatus.INSTALLED) openVsCode();
    };
}

const OpenVsCode = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch();
    return (
        <Button
            icon="x-mdi-rocket"
            label="Open VS Code"
            title="Open Visual Studio Code"
            disabled={isInProgress(environment)}
            variant="primary"
            onClick={() => dispatch(showInstallVsCodeExtensions())}
        />
    );
};

OpenVsCode.propTypes = { environment: environmentPropType.isRequired };

export default OpenVsCode;
