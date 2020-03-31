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

import { promisify } from 'util';
import { exec } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import DecompressZip from 'decompress-zip';
import { remote } from 'electron';
import fse from 'fs-extra';
import {
    isFirstInstall, setHasInstalledAnNcs, toolchainUrl, persistedInstallDir as installDir,
} from '../../persistentStore';
import { showFirstInstallDialog } from '../../FirstInstall/firstInstallReducer';
import { showErrorDialog } from '../../launcherActions';

import {
    selectEnvironment,
    getLatestToolchain,
    getEnvironment,
} from '../managerReducer';
import {
    startInstallToolchain,
    finishInstallToolchain,
    setProgress,
    startCloningSdk,
    finishCloningSdk,
    startRemoving,
    finishRemoving,
    removeEnvironment,
    progress,
} from './environmentReducer';

const downloadZip = (toolchain, reportProgress) => new Promise((resolve, reject) => {
    const { name, sha512 } = toolchain;

    const hash = createHash('sha512');

    const downloadDir = path.resolve(installDir(), 'downloads');
    const zipLocation = path.resolve(downloadDir, name);
    fse.mkdirpSync(downloadDir);
    const writeStream = fs.createWriteStream(zipLocation);

    const url = toolchainUrl(name);

    remote.net.request({ url }).on('response', response => {
        const totalLength = response.headers['content-length'][0];
        let currentLength = 0;
        response.on('data', data => {
            hash.update(data);
            writeStream.write(data);

            currentLength += data.length;
            reportProgress(currentLength, totalLength, 1);
        });
        response.on('end', () => {
            writeStream.end(() => {
                if (hash.digest('hex') !== sha512) {
                    return reject(new Error(`Checksum verification failed ${url}`));
                }
                return resolve(zipLocation);
            });
        });
        response.on('error', error => reject(new Error(`Error when reading ${url}: `
            + `${error.message}`)));
    })
        .on('error', error => reject(new Error(`Unable to download ${url}: ${error.message}`)))
        .end();
});

const unzip = (src, dest, reportProgress) => new Promise(resolve => {
    new DecompressZip(src)
        .on('error', err => console.error('Caught an error', err))
        .on('extract', () => resolve())
        .on('progress', (fileIndex, fileCount) => reportProgress(fileIndex, fileCount, 2))
        .extract({ path: dest });
});

const setProgressIfChanged = (version, currentValue, maxValue, half) => (dispatch, getState) => {
    const prevProgress = progress(getEnvironment(getState(), version));
    const newProgress = Math.round(currentValue / maxValue * 50) + (half === 2 ? 50 : 0);

    if (newProgress !== prevProgress) {
        dispatch(setProgress(version, newProgress));
    }
};

const installToolchain = async (dispatch, version, toolchain, toolchainDir) => {
    const reportProgress = (currentValue, maxValue, half) => (
        dispatch(setProgressIfChanged(version, currentValue, maxValue, half)));

    dispatch(startInstallToolchain(version));

    fse.mkdirpSync(toolchainDir);
    const zipLocation = await downloadZip(toolchain, reportProgress);
    await unzip(zipLocation, toolchainDir, reportProgress);

    dispatch(finishInstallToolchain(version, toolchainDir));
};

export const isWestPresent = toolchainDir => fs.existsSync(path.resolve(toolchainDir, '../.west/config'));

export const cloneNcs = async (dispatch, version, toolchainDir, justUpdate) => {
    dispatch(startCloningSdk(version));

    if (!justUpdate) {
        await fse.remove(path.resolve(path.dirname(toolchainDir), '.west'));
    }
    try {
        const gitBash = path.resolve(toolchainDir, 'git-bash.exe');
        const initScript = `unset ZEPHYR_BASE; toolchain/ncsmgr/ncsmgr init-ncs ${justUpdate ? '--just-update' : ''}; sleep 3`;
        await promisify(exec)(`"${gitBash}" -c "${initScript}"`);
    } catch (error) {
        console.error(`Failed to clone NCS with error: ${error}`);
    }

    dispatch(finishCloningSdk(version, isWestPresent(toolchainDir)));
};

export const install = async (dispatch, { version, toolchains }, justUpdate) => {
    const toolchain = getLatestToolchain(toolchains);
    const toolchainDir = path.resolve(installDir(), version, 'toolchain');

    dispatch(selectEnvironment(version));
    if (isFirstInstall()) {
        dispatch(showFirstInstallDialog());
    }
    setHasInstalledAnNcs();

    await installToolchain(dispatch, version, toolchain, toolchainDir);
    await cloneNcs(dispatch, version, toolchainDir, justUpdate);
};

export const remove = async (dispatch, { toolchainDir, version }) => {
    const toBeDeletedDir = path.resolve(toolchainDir, '..', '..', 'toBeDeleted');
    dispatch(startRemoving(version));

    const srcDir = path.dirname(toolchainDir);
    let renameOfDirSuccessful = false;
    try {
        await fse.move(srcDir, toBeDeletedDir, { overwrite: true });
        renameOfDirSuccessful = true;
        await fse.remove(toBeDeletedDir);
    } catch (error) {
        const [,, message] = `${error}`.split(/[:,] /);
        dispatch(showErrorDialog(
            `Failed to remove ${srcDir}, ${message}. `
            + 'Please close any application or window that might keep this '
            + 'environment locked, then try to remove it again.',
        ));
    }
    if (renameOfDirSuccessful) {
        dispatch(removeEnvironment(version));
    }

    dispatch(finishRemoving(version));
};
