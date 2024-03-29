/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { net } from '@electron/remote';
import {
    AppThunk,
    logger,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { createHash } from 'crypto';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

import {
    persistedInstallDirOfToolChainDefault,
    toolchainUrl,
} from '../../../persistentStore';
import { RootState, Toolchain } from '../../../state';
import EventAction from '../../../usageDataActions';
import { setProgress } from '../environmentReducer';
import { calculateTimeConsumed } from './helpers';
import { DOWNLOAD, reportProgress } from './reportProgress';

const getInstallDir = () => persistedInstallDirOfToolChainDefault();

export const downloadToolchain =
    (
        version: string,
        { name, sha512, uri }: Partial<Toolchain>
    ): AppThunk<RootState, Promise<string>> =>
    dispatch =>
        new Promise<string>((resolve, reject) => {
            getInstallDir()
                .then(installDir => {
                    logger.info(`Downloading toolchain ${version}`);
                    dispatch(setProgress(version, 'Downloading', 0));
                    const hash = createHash('sha512');

                    const url = uri || toolchainUrl(name || '');
                    const filename = name || path.basename(url);
                    telemetry.sendEvent(EventAction.DOWNLOAD_TOOLCHAIN, {
                        url,
                    });

                    const downloadDir = path.resolve(installDir, 'downloads');
                    const packageLocation = path.resolve(downloadDir, filename);
                    fse.mkdirpSync(downloadDir);
                    const writeStream = fs.createWriteStream(packageLocation);

                    const downloadTimeStart = new Date();

                    const request = net.request({ url });
                    request.setHeader('Accept-Encoding', 'identity');
                    request.on('response', response => {
                        const totalLength = response.headers[
                            'content-length'
                        ] as unknown as number | undefined;
                        let currentLength = 0;
                        response.on('data', (data: Buffer) => {
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
                                const timeInMin =
                                    calculateTimeConsumed(downloadTimeStart);

                                telemetry.sendEvent(
                                    EventAction.DOWNLOAD_TOOLCHAIN_SUCCESS,
                                    { url }
                                );
                                telemetry.sendEvent(
                                    EventAction.DOWNLOAD_TOOLCHAIN_TIME,
                                    { timeInMin, url }
                                );
                                logger.info(
                                    `Finished downloading version ${version} of the toolchain after approximately ${timeInMin} minute(s)`
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
                    });
                    request.on('error', error =>
                        reject(
                            new Error(
                                `Unable to download ${url}: ${error.message}`
                            )
                        )
                    );
                    request.end();
                })
                .catch(() => reject(new Error('Install directory not found')));
        });

export default downloadToolchain;
