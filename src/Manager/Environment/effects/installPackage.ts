/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
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

import fse from 'fs-extra';
import path from 'path';
import { usageData } from 'pc-nrfconnect-shared';

import { showErrorDialog } from '../../../launcherActions';
import { persistedInstallDir as installDir } from '../../../persistentStore';
import { Dispatch } from '../../../state';
import EventAction from '../../../usageDataActions';
import { addLocallyExistingEnvironment } from '../../managerReducer';
import {
    finishInstallToolchain,
    startInstallToolchain,
} from '../environmentReducer';
import { updateConfigFile } from '../segger';
import { cloneNcs } from './cloneNcs';
import { downloadToolchain } from './downloadToolchain';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { unpack } from './unpack';

// eslint-disable-next-line import/prefer-default-export
export const installPackage =
    (urlOrFilePath: string) => async (dispatch: Dispatch) => {
        usageData.sendUsageData(
            EventAction.INSTALL_TOOLCHAIN_FROM_PATH,
            `${urlOrFilePath}`
        );
        const match =
            /ncs-toolchain-(v?.+?)([-_]\d{8}-[^.]+).[zip|dmg|snap]/.exec(
                urlOrFilePath
            );
        if (!match) {
            const errorMsg =
                'Filename is not recognized as a toolchain package.';
            dispatch(showErrorDialog(errorMsg));
            usageData.sendErrorReport(errorMsg);
            return;
        }

        try {
            const version = match[1];
            const toolchainDir = path.resolve(
                installDir(),
                version,
                'toolchain'
            );

            await dispatch(ensureCleanTargetDir(toolchainDir));

            fse.mkdirpSync(toolchainDir);

            dispatch(
                addLocallyExistingEnvironment(
                    version,
                    toolchainDir,
                    false,
                    false
                )
            );
            dispatch(startInstallToolchain(version));

            const filePath = fse.existsSync(urlOrFilePath)
                ? urlOrFilePath
                : await dispatch(
                      downloadToolchain(version, { uri: urlOrFilePath })
                  );

            await dispatch(unpack(version, filePath, toolchainDir));
            updateConfigFile(toolchainDir);
            dispatch(finishInstallToolchain(version, toolchainDir));
            await dispatch(cloneNcs(version, toolchainDir, false));
        } catch (error) {
            dispatch(showErrorDialog(`${error.message || error}`));
            usageData.sendErrorReport(error.message || error);
        }
    };
