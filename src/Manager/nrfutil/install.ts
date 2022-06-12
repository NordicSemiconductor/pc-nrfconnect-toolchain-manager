/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';

import { persistedInstallDir as installDir } from '../../persistentStore';
import handleChunk from './handleChunk';
import nrfutilToolchainManager from './nrfutilToolchainManager';
import type { TaskEvent } from './task';

export default (
    version: string,
    onUpdate: (update: TaskEvent) => void,
    signal: AbortSignal
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'install',
            '--install-dir',
            installDir(),
            version,
        ]);

        signal.addEventListener('abort', () => {
            tcm.kill();
            resolve();
        });

        let error = '';
        tcm.stderr.on('data', (data: Buffer) => {
            error += data.toString();
        });

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', code =>
            code === 0 ? resolve() : reject(new Error(error))
        );
    });
