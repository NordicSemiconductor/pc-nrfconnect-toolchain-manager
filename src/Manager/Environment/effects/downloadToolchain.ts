/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
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
    (version: string, { name, sha512, uri }: Partial<Toolchain>) =>
    (dispatch: Dispatch) =>
        new Promise<string>((resolve, reject) => {
            logger.info(`Downloading toolchain ${version}`);
            dispatch(setProgress(version, 'Downloading', 0));
            const hash = createHash('sha512');

            const url = uri || toolchainUrl(name || '');
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
