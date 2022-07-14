/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import treeKill from 'tree-kill';

import { persistedInstallDir as installDir } from '../../persistentStore';
import { nrfutilSpawn } from './nrfutilChildProcess';
import type { TaskEvent } from './task';

export default (
    version: string,
    onUpdate: (update: TaskEvent) => void,
    signal: AbortSignal
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = nrfutilSpawn(
            ['install', '--install-dir', installDir(), version],
            (line: string) => onUpdate(JSON.parse(line))
        );

        const abortListener = () => treeKill(tcm.pid);
        signal.addEventListener('abort', abortListener);

        let error = '';
        tcm.stderr.on('data', (data: Buffer) => {
            error += data.toString();
        });
        tcm.on('close', code => {
            signal.removeEventListener('abort', abortListener);
            if (code === 0 || signal.aborted) {
                resolve();
            }
            reject(new Error(error));
        });
    });
