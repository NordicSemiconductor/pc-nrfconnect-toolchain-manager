/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { dialog } from '@electron/remote';
import { SaveDialogReturnValue } from 'electron';
import fs from 'fs';
import path from 'path';
import logger from 'pc-nrfconnect-shared/src/logging';
import describeError from 'pc-nrfconnect-shared/src/logging/describeError';

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import toolchainPath from '../toolchainPath';
import { nrfutilExecSync } from './nrfutilChildProcess';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const getEnvAsScript = (version: string, cmd: boolean) => {
    const script = nrfutilExecSync(
        `"${nrfutilToolchainManager()}" env --ncs-version "${version}" --install-dir "${installDir()}" --as-script ${
            cmd ? 'cmd' : 'sh'
        }`
    );
    const zephyrBase = `${cmd ? 'SET' : 'export'} ZEPHYR_BASE=${sdkPath(
        version,
        'zephyr'
    )}\n`;

    return [script, zephyrBase].join('');
};

type FileFormat = 'cmd' | 'sh' | 'undecided';

const getFileFormatFilter = (fileFormat: FileFormat) => {
    if (fileFormat === 'cmd') {
        [{ name: 'CMD script', extensions: ['cmd'] }];
    } else if (fileFormat === 'sh') {
        [{ name: 'Shell script', extensions: ['sh'] }];
    } else {
        return [
            { name: 'Shell script', extensions: ['sh'] },
            { name: 'CMD script', extensions: ['cmd'] },
        ];
    }
};

export const saveEnvScript = (version: string, fileFormat: FileFormat) => {
    const options = {
        title: 'Create environment script',
        defaultPath: path.resolve(
            toolchainPath(version),
            `env.${fileFormat === 'undecided' ? 'sh' : fileFormat}`
        ),
        filters: getFileFormatFilter(fileFormat),
    };

    const save = ({ filePath }: SaveDialogReturnValue) => {
        if (filePath) {
            try {
                let envScript;

                if (process.platform === 'win32' && filePath.endsWith('cmd')) {
                    envScript = getEnvAsScript(version, true);
                } else if (
                    process.platform !== 'win32' ||
                    filePath.endsWith('sh')
                ) {
                    envScript = getEnvAsScript(version, false);
                } else {
                    logger.error('Failed to save file: Invalid file format');
                    return;
                }

                fs.writeFile(filePath, envScript, err => {
                    if (err) {
                        logger.error(
                            `Failed to save file: ${describeError(err)}`
                        );
                        return;
                    }
                    logger.info(`File is successfully saved at ${filePath}`);
                });
            } catch (e) {
                logger.error(
                    `Failed to generate environment script: ${describeError(e)}`
                );
            }
        }
    };

    dialog.showSaveDialog(options).then(save);
};
