/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import remote from '@electron/remote';
import { ChildProcess, spawn } from 'child_process';
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
