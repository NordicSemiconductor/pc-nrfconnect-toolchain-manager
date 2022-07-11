/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { stripAndPrintNrfutilLogOutput } from './nrfutilChildProcess';
import type { TaskEvent } from './task';

export default (onUpdate: (update: TaskEvent) => void) => {
    let buffer = '';
    return (chunk: Buffer) => {
        buffer += chunk.toString('utf8');

        while (buffer.includes('\n')) {
            const message = buffer.split('\n')[0];
            buffer = buffer.substring(message.length + 1);

            const strippedLog = stripAndPrintNrfutilLogOutput(message);
            if (strippedLog?.length > 0) onUpdate(JSON.parse(strippedLog));
        }
    };
};
