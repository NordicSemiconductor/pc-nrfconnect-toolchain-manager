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

import { createHash } from 'crypto';
import { remote } from 'electron';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import {
    persistedInstallDir as installDir,
    toolchainUrl,
} from '../../../persistentStore';
import { Dispatch, Toolchain } from '../../../state';
import EventAction from '../../../usageDataActions';
import { setProgress } from '../environmentReducer';
import { calculateTimeConsumed } from './helpers';
import { DOWNLOAD, reportProgress } from './reportProgress';

export const downloadToolchain =
    (version: string, { name, sha512, uri }: Toolchain) =>
    async (dispatch: Dispatch) =>
        new Promise((resolve, reject) => {
            logger.info(`Downloading toolchain ${version}`);
            dispatch(setProgress(version, 'Downloading', 0));
            const hash = createHash('sha512');

            const url = uri || toolchainUrl(name);
            const filename = name || path.basename(url);
            usageData.sendUsageData(EventAction.DOWNLOAD_TOOLCHAIN, url);

            const downloadDir = path.resolve(installDir(), 'downloads');
            const packageLocation = path.resolve(downloadDir, filename);
            fse.mkdirpSync(downloadDir);
            const writeStream = fs.createWriteStream(packageLocation);

            const downloadTimeStart = new Date();
            remote.net
                .request({ url })
                .on('response', response => {
                    const totalLength = response.headers[
                        'content-length'
                    ] as unknown as number;
                    let currentLength = 0;
                    response.on('data', data => {
                        hash.update(data);
                        writeStream.write(data);

                        currentLength += data.length;
                        dispatch(
                            reportProgress(
                                version,
                                currentLength,
                                totalLength,
                                DOWNLOAD
                            )
                        );
                    });
                    response.on('end', () => {
                        writeStream.end(() => {
                            const hex = hash.digest('hex');
                            if (sha512 && hex !== sha512) {
                                return reject(
                                    new Error(
                                        `Checksum verification failed ${url}`
                                    )
                                );
                            }
                            usageData.sendUsageData(
                                EventAction.DOWNLOAD_TOOLCHAIN_SUCCESS,
                                url
                            );
                            usageData.sendUsageData(
                                EventAction.DOWNLOAD_TOOLCHAIN_TIME,
                                `${calculateTimeConsumed(
                                    downloadTimeStart
                                )} min; ${url}`
                            );
                            logger.info(
                                `Finished downloading version ${version} of the toolchain after approximately ${calculateTimeConsumed(
                                    downloadTimeStart
                                )} minute(s)`
                            );
                            return resolve(packageLocation);
                        });
                    });
                    response.on('error', (error: Error) =>
                        reject(
                            new Error(
                                `Error when reading ${url}: ${error.message}`
                            )
                        )
                    );
                })
                .on('error', error =>
                    reject(
                        new Error(`Unable to download ${url}: ${error.message}`)
                    )
                )
                .end();
        });

export default downloadToolchain;
