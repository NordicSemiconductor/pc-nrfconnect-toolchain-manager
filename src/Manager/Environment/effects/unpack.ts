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

import { execSync } from 'child_process';
import { remote } from 'electron';
import extract from 'extract-zip';
import fse from 'fs-extra';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import { setProgress } from '../environmentReducer';
import { calculateTimeConsumed } from './helpers';
import { reportProgress, UNPACK } from './reportProgress';

const sudo = remote.require('sudo-prompt');

// eslint-disable-next-line import/prefer-default-export
export const unpack =
    (version: string, src: string, dest: string) =>
    async (dispatch: Dispatch) => {
        logger.info(`Unpacking toolchain ${version}`);
        usageData.sendUsageData(
            EventAction.UNPACK_TOOLCHAIN,
            `${version}; ${process.platform}; ${process.arch}`
        );
        const unpackTimeStart = new Date();
        dispatch(setProgress(version, 'Installing...', 50));
        switch (process.platform) {
            case 'win32': {
                let fileCount = 0;
                const totalFileCount = 26000; // ncs 1.4 has 25456 files
                await extract(src, {
                    dir: dest,
                    onEntry: () => {
                        fileCount += 1;
                        dispatch(
                            reportProgress(
                                version,
                                fileCount,
                                totalFileCount,
                                UNPACK
                            )
                        );
                    },
                });
                break;
            }
            case 'darwin': {
                const volume = execSync(
                    `hdiutil attach ${src} | grep -Eo "/Volumes/ncs-toolchain-.*"`
                )
                    .toString()
                    .trim();
                let n = 0;
                await fse.copy(path.join(volume, 'toolchain'), dest, {
                    filter: () => {
                        n += 1;
                        dispatch(reportProgress(version, n, 63000, UNPACK));
                        return true;
                    },
                });
                execSync(`hdiutil detach ${volume}`);
                break;
            }
            case 'linux': {
                await new Promise<void>((resolve, reject) =>
                    sudo.exec(
                        `snap install ${src} --devmode`,
                        { name: 'Toolchain Manager' },
                        (err: Error) => (err ? reject(err) : resolve())
                    )
                );
                dispatch(setProgress(version, 'Installing...', 99));
                fse.removeSync(dest);
                const shortVer = version.replace(/\./g, '');
                fse.symlinkSync(
                    `/snap/ncs-toolchain-${shortVer}/current`,
                    dest
                );
                break;
            }
            default:
        }

        const unpackInfo = `${version}; ${process.platform}; ${process.arch}`;
        usageData.sendUsageData(
            EventAction.UNPACK_TOOLCHAIN_SUCCESS,
            unpackInfo
        );
        usageData.sendUsageData(
            EventAction.UNPACK_TOOLCHAIN_TIME,
            `${calculateTimeConsumed(unpackTimeStart)} min; ${unpackInfo}`
        );
        logger.info(
            `Finished unpacking version ${unpackInfo} of the toolchain after approximately ${calculateTimeConsumed(
                unpackTimeStart
            )} minute(s)`
        );

        return undefined;
    };
