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

import { exec } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import DecompressZip from 'decompress-zip';
import { remote } from 'electron';
import fse from 'fs-extra';
import {
    isFirstInstall, setHasInstalledAnNcs, toolchainIndexUrl, toolchainUrl, installDir,
} from '../persistentStore';
import { showFirstInstallDialog } from '../FirstInstall/firstInstallReducer';
import { showInstallDirDialog } from '../InstallDir/installDirReducer';
import { showErrorDialog } from '../launcherActions';

import {
    selectEnvironment,
    updateEnvironmentList,
    setEnvironmentInProcess,
    removeEnvironment,
    setVersionToInstall,
    showConfirmRemoveDialog,
    getLatestToolchain,
    setEnvironmentProgress,
} from './environmentsReducer';

const { net } = remote;

const environmentUpdate = environment => (dispatch, getState) => {
    if (!environment) {
        throw new Error('No environment state provided');
    }

    const { environmentList } = getState().app.environments;
    const envIndex = environmentList.findIndex(v => v.version === environment.version);
    if (envIndex < 0) {
        environmentList.push(environment);
    } else {
        environmentList[envIndex] = {
            ...environmentList[envIndex],
            ...environment,
        };
    }
    dispatch(updateEnvironmentList(environmentList));
};

const getEnvironment = (version, getState) => {
    const { environmentList } = getState().app.environments;
    return environmentList.find(v => v.version === version);
};

export const checkLocalEnvironments = () => dispatch => {
    const subDirs = fs.readdirSync(installDir(), { withFileTypes: true })
        .filter(dirEnt => dirEnt.isDirectory())
        .map(({ name }) => path.resolve(installDir(), name));
    subDirs.map(subDir => fs.readdirSync(path.resolve(installDir(), subDir))
        .filter(d => !d.endsWith('.zip'))
        .map(dir => path.resolve(installDir(), subDir, dir, 'ncsmgr/manifest.env'))
        .filter(fs.existsSync))
        .flat()
        .forEach(toolchain => {
            const toolchainDir = path.resolve(toolchain, '../..');
            const envDirBasename = path.basename(path.resolve(toolchainDir, '..'));
            const isWestPresent = fs.existsSync(path.resolve(toolchainDir, '../.west/config'));
            dispatch(environmentUpdate({
                version: envDirBasename,
                toolchainDir,
                isWestPresent,
            }));
        });
};

export const downloadIndex = () => async dispatch => {
    const { status, environments } = await new Promise(resolve => {
        const request = net.request({ url: toolchainIndexUrl() });
        request.setHeader('pragma', 'no-cache');
        request.on('response', response => {
            let result = '';
            response.on('end', () => {
                resolve({ environments: JSON.parse(result), status: response.statusCode });
            });
            response.on('data', buf => {
                result += `${buf}`;
            });
        }).end();
    });

    if (status !== 200) {
        throw new Error(`Unable to download ${toolchainIndexUrl()}. Got status code ${status}`);
    }

    environments.forEach(environment => dispatch(environmentUpdate({ ...environment })));
};

const downloadZip = version => (dispatch, getState) => new Promise((resolve, reject) => {
    const { toolchains } = getEnvironment(version, getState);
    const { name, sha512 } = getLatestToolchain(toolchains);

    const hash = createHash('sha512');

    const downloadDir = path.resolve(installDir(), 'downloads');
    const zipLocation = path.resolve(downloadDir, name);
    fse.mkdirpSync(downloadDir);
    const writeStream = fs.createWriteStream(zipLocation);

    const url = toolchainUrl(name);

    net.request({ url }).on('response', response => {
        const totalLength = response.headers['content-length'][0];
        let currentLength = 0;
        response.on('data', data => {
            hash.update(data);
            writeStream.write(data);

            currentLength += data.length;
            const progress = Math.round(currentLength / totalLength * 49);
            dispatch(setEnvironmentProgress(version, progress));
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

export const unzip = (
    version,
    src,
    dest,
) => (dispatch, getState) => new Promise(resolve => {
    const unzipper = new DecompressZip(src);
    unzipper.on('error', err => {
        console.log('Caught an error', err);
    });
    unzipper.on('extract', () => {
        const { environmentList } = getState().app.environments;
        const environment = environmentList.find(v => v.version === version);
        dispatch(environmentUpdate({
            ...environment,
            toolchainDir: dest,
        }));
        resolve();
    });
    unzipper.on('progress', (fileIndex, fileCount) => {
        const progress = Math.round((fileIndex) / fileCount * 50) + 49;
        dispatch(setEnvironmentProgress(version, progress));
    });
    unzipper.extract({ path: dest });
});

export const cloneNcs = (dispatch, environment) => new Promise((resolve, reject) => {
    const { toolchainDir } = environment;
    const gitBash = path.resolve(toolchainDir, 'git-bash.exe');
    const initScript = 'unset ZEPHYR_BASE; toolchain/ncsmgr/ncsmgr init-ncs; sleep 3';

    fse.removeSync(path.resolve(path.dirname(toolchainDir), '.west'));

    dispatch(environmentUpdate({
        ...environment,
        isCloning: true,
    }));
    exec(`"${gitBash}" -c "${initScript}"`, error => {
        if (error) return reject(new Error(`Failed to clone NCS with error: ${error}`));
        dispatch(environmentUpdate({
            ...environment,
            isCloning: false,
        }));
        return resolve();
    });
});

export const init = () => dispatch => {
    fse.mkdirpSync(installDir());
    dispatch(checkLocalEnvironments());
    dispatch(downloadIndex());
};

export const confirmInstall = (dispatch, { version }) => {
    dispatch(setVersionToInstall(version));
    dispatch(showInstallDirDialog());
};

export const confirmRemove = (dispatch, { version }) => {
    dispatch(showConfirmRemoveDialog(version));
};

export const install = version => async dispatch => {
    const toolchainDir = 'toolchain';
    const unzipDest = path.resolve(installDir(), version, toolchainDir);

    dispatch(selectEnvironment(version));
    if (isFirstInstall()) {
        dispatch(showFirstInstallDialog());
    }

    dispatch(setEnvironmentInProcess(version, true));
    fse.mkdirpSync(unzipDest);
    const zipLocation = await dispatch(downloadZip(version));
    await dispatch(unzip(version, zipLocation, unzipDest));
    await cloneNcs(dispatch, version);

    setHasInstalledAnNcs();
    dispatch(checkLocalEnvironments());
    dispatch(setEnvironmentInProcess(version, false));
};

export const remove = version => async (dispatch, getState) => {
    const environment = getEnvironment(version, getState);
    const { toolchainDir } = environment;
    const toBeDeletedDir = path.resolve(toolchainDir, '..', '..', 'toBeDeleted');
    dispatch(setEnvironmentInProcess(version, true));
    dispatch(environmentUpdate({
        ...environment,
        isRemoving: true,
    }));

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

    dispatch(setEnvironmentInProcess(version, false));
    dispatch(environmentUpdate({ ...environment, isRemoving: false }));
    if (renameOfDirSuccessful) {
        dispatch(removeEnvironment(version));
    }
};
