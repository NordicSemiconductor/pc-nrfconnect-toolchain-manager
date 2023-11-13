/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

let abortController: AbortController = new AbortController();
abortController.signal.addEventListener('abort', () => {
    abortController = new AbortController();
});

export const getAbortController = () => abortController;
