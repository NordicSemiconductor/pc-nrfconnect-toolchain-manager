/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';

import type { TaskEvent } from '../../state';
import handleChunk from './handleChunk';
import nrfutilToolchainManager from './nrfutilToolchainManager';

const noop = () => {};
export default (
    version: string,
    onUpdate: (update: TaskEvent) => void = noop
) =>
    new Promise(resolve => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'remove',
            version,
        ]);

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', resolve);
    });
