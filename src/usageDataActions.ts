/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met =
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
}

export default EventAction;
