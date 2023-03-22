/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { dialog } from '@electron/remote';
import fs from 'fs';
import path from 'path';
import logger from 'pc-nrfconnect-shared/src/logging';
import describeError from 'pc-nrfconnect-shared/src/logging/describeError';

import { persistedInstallDir as installDir } from '../../persistentStore';
import toolchainPath from '../toolchainPath';
import { nrfutilExecSync } from './nrfutilChildProcess';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export const getEnvAsScript = (version: string, cmd: boolean) =>
    nrfutilExecSync(
        `"${nrfutilToolchainManager()}" env --ncs-version "${version}" --install-dir "${installDir()}" --as-script ${
            cmd ? 'cmd' : 'sh'
        }`
    );

export const saveEnvScript = (version: string, cmd: boolean) => {
    const options = {
        title: 'Create environment script',
        defaultPath: path.resolve(
            toolchainPath(version),
            `env.${cmd ? 'cmd' : 'sh'}`
        ),
        filters: [
            cmd
                ? { name: 'Cmd', extensions: ['cmd'] }
                : { name: 'sh', extensions: ['sh'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    };

    // eslint-disable-next-line no-undef
    const save = ({ filePath }: Electron.SaveDialogReturnValue) => {
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
            } catch (e) {
                logger.error(
                    `Failed to generate environment script: ${describeError(e)}`
                );
            }
        }
    };

    dialog.showSaveDialog(options).then(save);
};
