/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

// The actions in this file are handled by the reducers in pc-nrfconnect-launcher or
// pc-nrfconnect-shared, so we instead of defining them here, we really should import
// them from there. But before we can correct this, we need to upgrade to a new version.

enum EventAction {
    LAUNCH_APP = 'Launch app',
    LAUNCH_MANAGER_VIEW = 'Launch manager view',
    LAUNCH_SETTINGS_VIEW = 'Launch settings view',
    LAUNCH_ABOUT_VIEW = 'Launch about view',
    INSTALL_TOOLCHAIN_FROM_INDEX = 'Install toolchain from index',
    INSTALL_TOOLCHAIN_FROM_NRFUTIL = 'Install toolchain from nrfutil',
    INSTALL_TOOLCHAIN_FROM_PATH = 'Install toolchain from path',
    DOWNLOAD_TOOLCHAIN = 'Download toolchain',
    DOWNLOAD_TOOLCHAIN_SUCCESS = 'Download toolchain successfully',
    DOWNLOAD_TOOLCHAIN_TIME = 'Download toolchain time consumed',
    UNPACK_TOOLCHAIN = 'Unpack toolchain',
    UNPACK_TOOLCHAIN_SUCCESS = 'Unpack toolchain successfully',
    UNPACK_TOOLCHAIN_TIME = 'Unpack toolchain time consumed',
    CLONE_NCS = 'Clone nRF Connect SDK',
    CLONE_NCS_SUCCESS = 'Clone nRF Connect SDK successfully',
    CLONE_NCS_TIME = 'Clone nRF Connect SDK time consumed',
    OPEN_SES = 'Open SES',
    OPEN_BASH = 'Open bash',
    OPEN_CMD = 'Open command prompt',
    OPEN_TERMINAL = 'Open terminal',
    OPEN_DIR = 'Open directory',
    UPDATE_SDK = 'Update SDK',
    REMOVE_TOOLCHAIN = 'Remove toolchain',
    SHOW_FIRST_INSTALL_INSTRUCTIONS = 'Show first install instructions',
    REPORT_OS_INFO = 'Report OS info',
    REPORT_ERROR = 'Report error',
    REPORT_LOCAL_ENVS = 'Report locally existing environments',
    OPEN_VS_CODE = 'Open VS Code',
    INSTALL_VS_EXTENSION = 'Install VS Code extension',
    VS_INSTALLED = 'Status of VS Code installation',
    NRFJPROG_INSTALLED = 'Status of nrfjprog installation',
}

export default EventAction;
