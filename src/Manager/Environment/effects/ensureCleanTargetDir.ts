/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
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

import { remote } from 'electron';
import fs from 'fs';
import path from 'path';

import { showReduxConfirmDialogAction } from '../../../ReduxConfirmDialog/reduxConfirmDialogReducer';
import { Dispatch } from '../../../state';
import { removeDir } from './removeDir';

export const ensureCleanTargetDir =
    (toolchainDir: string) => async (dispatch: Dispatch) => {
        let dir = toolchainDir;
        let toBeDeleted = null;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const westdir = path.resolve(dir, '.west');
            if (fs.existsSync(westdir)) {
                toBeDeleted = westdir;
                break;
            }
            const parent = path.dirname(dir);
            if (parent === dir) {
                break;
            }
            dir = parent;
        }
        if (toBeDeleted) {
            try {
                await dispatch(confirmRemoveDir(toBeDeleted));
                await dispatch(removeDir(toBeDeleted));
            } catch (err) {
                throw new Error(
                    `${toBeDeleted} must be removed to continue installation`
                );
            }
            await dispatch(ensureCleanTargetDir(toolchainDir));
        }
    };

export default ensureCleanTargetDir;

const showReduxConfirmDialog =
    ({ ...args }) =>
    (dispatch: Dispatch) =>
        new Promise<void>((resolve, reject) => {
            dispatch(
                showReduxConfirmDialogAction({
                    callback: canceled => (canceled ? reject() : resolve()),
                    ...args,
                })
            );
        });

const confirmRemoveDir = (directory: string) => (dispatch: Dispatch) =>
    dispatch(
        showReduxConfirmDialog({
            title: 'Inconsistent directory structure',
            content:
                `The \`${directory}\` directory blocks installation, and should be removed.\n\n` +
                'If this directory is part of manually installed nRF Connect SDK environment, ' +
                'consider changing the installation directory in SETTINGS.\n\n' +
                'If this directory is left over from an incorrect installation, click _Remove_.\n\n' +
                'Should you intend to manually remedy the issue, click _Open folder_. ' +
                'Make sure hidden items are visible.',
            confirmLabel: 'Remove',
            onOptional: () => remote.shell.showItemInFolder(directory),
            optionalLabel: 'Open folder',
        })
    );
