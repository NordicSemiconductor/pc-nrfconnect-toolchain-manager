/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';
import treeKill from 'tree-kill';

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

        const abortListener = () => treeKill(tcm.pid);
        signal.addEventListener('abort', abortListener);

        let error = '';
        tcm.stderr.on('data', (data: Buffer) => {
            error += data.toString();
        });

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', code => {
            signal.removeEventListener('abort', abortListener);
            code === 0 || signal.aborted ? resolve() : reject(new Error(error));
        });
    });
