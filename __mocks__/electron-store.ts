/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export default jest.fn(() => ({
    get: (_: unknown, defaultValue: unknown) => defaultValue,
    set: () => undefined,
}));
