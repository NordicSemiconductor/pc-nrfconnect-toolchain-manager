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

import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { showFirstInstallDialog } from '../../../FirstInstall/firstInstallSlice';
import { showErrorDialog } from '../../../launcherActions';
import {
    isFirstInstall,
    persistedInstallDir as installDir,
    setHasInstalledAnNcs,
} from '../../../persistentStore';
import { Dispatch, Environment } from '../../../state';
import EventAction from '../../../usageDataActions';
import { getLatestToolchain, selectEnvironment } from '../../managerSlice';
import { cloneNcs } from './cloneNcs';
import { ensureCleanTargetDir } from './ensureCleanTargetDir';
import { installToolchain } from './installToolchain';

// eslint-disable-next-line import/prefer-default-export
export const install =
    ({ version, toolchains }: Environment, justUpdate: boolean) =>
    async (dispatch: Dispatch) => {
        logger.info(`Start to install toolchain ${version}`);
        const toolchain = getLatestToolchain(toolchains);
        const toolchainDir = path.resolve(installDir(), version, 'toolchain');
        logger.info(`Installing ${toolchain?.name} at ${toolchainDir}`);
        logger.debug(`Install with toolchain version ${toolchain?.version}`);
        logger.debug(`Install with sha512 ${toolchain?.sha512}`);
        usageData.sendUsageData(
            EventAction.INSTALL_TOOLCHAIN_FROM_INDEX,
            `${version}; ${toolchain?.name}`
        );

        dispatch(selectEnvironment(version));
        if (isFirstInstall()) {
            logger.info(`Show first install dialog for toolchain ${version}`);
            dispatch(showFirstInstallDialog());
        }
        setHasInstalledAnNcs();

        try {
            if (toolchain === undefined) throw new Error('No toolchain found');
            await dispatch(ensureCleanTargetDir(toolchainDir));
            await dispatch(installToolchain(version, toolchain, toolchainDir));
            await dispatch(cloneNcs(version, toolchainDir, justUpdate));
        } catch (error) {
            dispatch(showErrorDialog(`${error.message || error}`));
            usageData.sendErrorReport(error.message || error);
        }
    };
