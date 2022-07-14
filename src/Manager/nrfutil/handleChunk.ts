/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export default (
    onData: (line: string) => void,
    filterLine: (line: string) => string
) => {
    let buffer = '';

    return (chunk: Buffer) => {
        buffer += chunk.toString('utf8');

        while (buffer.includes('\n')) {
            const message = buffer.split('\n')[0];
            buffer = buffer.substring(message.length + 1);

            const strippedLog = filterLine(message);
            if (strippedLog.length > 0) {
                onData(strippedLog);
            }
        }
    };
};
