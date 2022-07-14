/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import handleChunk from './handleChunk';

test('parse chunks into messages', () => {
    const handleChunks = (chunks: string[]) => {
        const messages: string[] = [];
        const handler = handleChunk(
            line => messages.push(line),
            line => line
        );
        chunks.forEach(chunk => handler(Buffer.from(chunk, 'utf-8')));
        return messages;
    };

    // Two separate messages
    expect(handleChunks(['{}\n', '{}\n']).length).toBe(2);
    // 1 full and 1 partial first chunk
    expect(handleChunks(['{}\n{', '}\n']).length).toBe(2);
    // 1 full first message and partial in next
    expect(handleChunks(['{}\n', '{']).length).toBe(1);
    // 2 full in first message, partial in next
    expect(handleChunks(['{}\n{}\n', '{}']).length).toBe(2);
});
