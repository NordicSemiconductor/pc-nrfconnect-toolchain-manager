/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { dialog } from '@electron/remote';
import {
    describeError,
    logger,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { SaveDialogReturnValue } from 'electron';
import fs from 'fs';
import path from 'path';

import { persistedInstallDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import toolchainManager from '../ToolchainManager/toolchainManager';

export const getEnvAsScript = async (version: string, cmd: boolean) => {
    const script = await toolchainManager.env(
        cmd ? 'cmd' : 'sh',
        version,
        persistedInstallDir()
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
            { name: 'CMD script', extensions: ['cmd'] },
            { name: 'Shell script', extensions: ['sh'] },
        ];
    }
};

export const saveEnvScript = (
    version: string,
    fileFormat: FileFormat,
    defaultPath = ''
) => {
    const options = {
        title: 'Create environment script',
        defaultPath: path.resolve(
            defaultPath,
            `env.${fileFormat === 'undecided' ? 'cmd' : fileFormat}`
        ),
        filters: getFileFormatFilter(fileFormat),
    };

    const save = async ({ filePath }: SaveDialogReturnValue) => {
        if (filePath) {
            try {
                let envScript;

                if (process.platform === 'win32' && filePath.endsWith('cmd')) {
                    envScript = await getEnvAsScript(version, true);
                } else if (
                    process.platform !== 'win32' ||
                    filePath.endsWith('sh')
                ) {
                    envScript = await getEnvAsScript(version, false);
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
