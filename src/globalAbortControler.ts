/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

let abortController: AbortController | undefined;

export const getNewAbortController = () => {
    abortController = new AbortController();
    return abortController;
};

export const getExistingAbortController = () => abortController;
