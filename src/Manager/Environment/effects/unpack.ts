/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { logger, usageData } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { execSync } from 'child_process';
import extract from 'extract-zip';
import fse from 'fs-extra';
import path from 'path';

import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import { setProgress } from '../environmentReducer';
import { calculateTimeConsumed } from './helpers';
import { reportProgress, UNPACK } from './reportProgress';

export const unpack =
    (version: string, src: string, dest: string) =>
    async (dispatch: Dispatch) => {
        logger.info(`Unpacking toolchain ${version}`);
        usageData.sendUsageData(EventAction.UNPACK_TOOLCHAIN, {
            version,
            platform: process.platform,
            arch: process.arch,
        });
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
            default:
        }

        const timeInMin = calculateTimeConsumed(unpackTimeStart);
        usageData.sendUsageData(EventAction.UNPACK_TOOLCHAIN_SUCCESS, {
            timeInMin,
            version,
            platform: process.platform,
            arch: process.arch,
        });
        usageData.sendUsageData(EventAction.UNPACK_TOOLCHAIN_TIME, {
            timeInMin,
            version,
            platform: process.platform,
            arch: process.arch,
        });
        logger.info(
            `Finished unpacking version ${version}; ${process.platform}; ${
                process.arch
            } of the toolchain after approximately ${calculateTimeConsumed(
                unpackTimeStart
            )} minute(s)`
        );

        return undefined;
    };
