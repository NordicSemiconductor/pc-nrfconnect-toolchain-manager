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

export const saveEnvScript = (version: string, cmd: boolean) => {
    const options = {
        title: 'Create environment script',
        defaultPath: path.resolve(
            toolchainPath(version),
            `env.${cmd ? 'cmd' : 'sh'}`
        ),
        filters: [
            cmd
                ? { name: 'CMD script', extensions: ['cmd'] }
                : { name: 'Shell script', extensions: ['sh'] },
        ],
    };

    const save = ({ filePath }: SaveDialogReturnValue) => {
        if (filePath) {
            try {
                const envScript = getEnvAsScript(version, cmd);

                fs.writeFile(filePath, envScript, err => {
                    if (err) {
                        logger.error(
                            `Failed to save file: ${describeError(err)}`
                        );
                    }
                    logger.info(`File is successfully saved at ${filePath}`);
                });
                fs.chmod(filePath, '755', err => {
                    if (err) {
                        logger.warn('Failed to save file as executable.');
                    }
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
