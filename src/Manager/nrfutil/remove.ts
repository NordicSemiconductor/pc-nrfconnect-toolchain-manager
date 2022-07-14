/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { persistedInstallDir as installDir } from '../../persistentStore';
import { nrfutilSpawn } from './nrfutilChildProcess';
import type { TaskEvent } from './task';

const noop = () => {};
export default (
    version: string,
    onUpdate: (update: TaskEvent) => void = noop
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = nrfutilSpawn(
            ['remove', '--install-dir', installDir(), version],
            (line: string) => onUpdate(JSON.parse(line))
        );

        let error = '';
        tcm.stderr.on('data', (data: Buffer) => {
            error += data.toString();
        });

        tcm.on('close', code => (code === 0 ? resolve() : reject(error)));
    });
