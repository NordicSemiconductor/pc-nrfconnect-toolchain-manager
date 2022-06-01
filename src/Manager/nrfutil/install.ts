/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';

import { persistedInstallDir as installDir } from '../../persistentStore';
import type { TaskEvent } from '../../state';
import handleChunk from './handleChunk';
import nrfutilToolchainManager from './nrfutilToolchainManager';

export default (
    version: string,
    onUpdate: (update: TaskEvent) => void,
    abortSignal?: AbortSignal
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'install',
            '--install-dir',
            installDir(),
            version,
        ]);

        let error = '';
        tcm.stderr.on('data', (data: Buffer) => {
            error += data.toString();
        });

        tcm.stdout.on('data', handleChunk(onUpdate));

        const close = (code: number) => {
            abortSignal?.removeEventListener('abort', killer);
            code === 0 ? resolve() : reject(new Error(error));
        };

        const killer = () => {
            tcm.off('close', close);
            tcm.kill();
            resolve();
        };

        abortSignal?.addEventListener('abort', killer);
        tcm.on('close', close);
    });
