/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

// The actions in this file are handled by the reducers in pc-nrfconnect-launcher or
// pc-nrfconnect-shared, so we instead of defining them here, we really should import
// them from there. But before we can correct this, we need to upgrade to a new version.

const showErrorDialog = (message: string) => ({
    type: 'ERROR_DIALOG_SHOW',
    message,
});

export default showErrorDialog;
