/* Copyright (c) 2015 - 2021, Nordic Semiconductor ASA
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

import { ChildProcess, spawn } from 'child_process';
import { remote } from 'electron';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import showErrorDialog from '../../../launcherActions';
import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import {
    finishCloningSdk,
    setProgress,
    startCloningSdk,
} from '../environmentReducer';
import { calculateTimeConsumed, isWestPresent } from './helpers';

const { spawn: remoteSpawn } = remote.require('child_process');

// eslint-disable-next-line import/prefer-default-export
export const cloneNcs =
    (version: string, toolchainDir: string, justUpdate: boolean) =>
    async (dispatch: Dispatch) => {
        dispatch(startCloningSdk(version));
        logger.info(`Cloning nRF Connect SDK ${version}`);
        usageData.sendUsageData(
            EventAction.CLONE_NCS,
            `${version}; ${process.platform}; ${process.arch}`
        );
        const cloneTimeStart = new Date();

        try {
            if (!justUpdate) {
                await fse.remove(
                    path.resolve(path.dirname(toolchainDir), '.west')
                );
            }

            let ncsMgr: ChildProcess;
            const update = justUpdate ? '--just-update' : '';
            switch (process.platform) {
                case 'win32': {
                    ncsMgr = spawn(
                        path.resolve(toolchainDir, 'bin', 'bash.exe'),
                        [
                            '-l',
                            '-c',
                            `unset ZEPHYR_BASE ; ncsmgr/ncsmgr init-ncs ${update}`,
                        ]
                    );

                    break;
                }
                case 'darwin': {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { ZEPHYR_BASE, ...env } = process.env;
                    const gitversion = fs
                        .readdirSync(`${toolchainDir}/Cellar/git`)
                        .pop();
                    env.PATH = `${toolchainDir}/bin:${remote.process.env.PATH}`;
                    env.GIT_EXEC_PATH = `${toolchainDir}/Cellar/git/${gitversion}/libexec/git-core`;
                    env.HOME = `${remote.process.env.HOME}`;

                    ncsMgr = spawn(
                        `${toolchainDir}/ncsmgr/ncsmgr`,
                        ['init-ncs', `${update}`],
                        { env }
                    );
                    break;
                }
                case 'linux': {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { ZEPHYR_BASE, ...env } = process.env;
                    env.PATH = `${toolchainDir}/bin:${toolchainDir}/usr/bin:${remote.process.env.PATH}`;
                    env.PYTHONHOME = `${toolchainDir}/lib/python3.8`;
                    env.PYTHONPATH = `${toolchainDir}/usr/lib/python3.8:${toolchainDir}/lib/python3.8/site-packages:${toolchainDir}/usr/lib/python3/dist-packages:${toolchainDir}/usr/lib/python3.8/lib-dynload`;
                    env.GIT_EXEC_PATH = `${toolchainDir}/usr/lib/git-core`;
                    env.LD_LIBRARY_PATH = `/var/lib/snapd/lib/gl:/var/lib/snapd/lib/gl32:/var/lib/snapd/void:${toolchainDir}/lib/python3.8/site-packages/.libs_cffi_backend:${toolchainDir}/lib/python3.8/site-packages/Pillow.libs:${toolchainDir}/lib/x86_64-linux-gnu:${toolchainDir}/segger_embedded_studio/bin:${toolchainDir}/usr/lib/x86_64-linux-gnu:${toolchainDir}/lib:${toolchainDir}/usr/lib:${toolchainDir}/lib/x86_64-linux-gnu:${toolchainDir}/usr/lib/x86_64-linux-gnu`;

                    ncsMgr = remoteSpawn(
                        `${toolchainDir}/ncsmgr/ncsmgr`,
                        ['init-ncs', `${update}`],
                        { env }
                    );
                    break;
                }
                default:
            }

            dispatch(setProgress(version, 'Initializing environment...'));
            logger.info(`Initializing environment for ${version}`);
            let err = '';
            await new Promise<void>((resolve, reject) => {
                ncsMgr.stdout?.on('data', data => {
                    const repo = (
                        /=== updating (\w+)/.exec(data.toString()) || []
                    ).pop();
                    if (repo) {
                        dispatch(
                            setProgress(
                                version,
                                `Updating ${repo} repository...`
                            )
                        );
                        logger.info(
                            `Updating ${repo} repository for ${version}`
                        );
                    }
                });
                ncsMgr.stderr?.on('data', data => {
                    err += `${data}`;
                });
                ncsMgr.on('exit', code => (code ? reject(err) : resolve()));
            });
        } catch (error) {
            const errorMsg = `Failed to clone the repositories: ${error}`;
            dispatch(showErrorDialog(errorMsg));
            usageData.sendErrorReport(errorMsg);
        }

        dispatch(finishCloningSdk(version, isWestPresent(toolchainDir)));
        usageData.sendUsageData(
            EventAction.CLONE_NCS_SUCCESS,
            `${version}; ${process.platform}; ${process.arch}`
        );
        usageData.sendUsageData(
            EventAction.CLONE_NCS_TIME,
            `${calculateTimeConsumed(cloneTimeStart)} min; ${version}`
        );
        logger.info(
            `Finished cloning version ${version} of the nRF Connect SDK after approximately ${calculateTimeConsumed(
                cloneTimeStart
            )} minute(s)`
        );
    };
