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
import { remote, shell } from 'electron';
import fse from 'fs-extra';
import semver from 'semver';
import { isFirstInstall, setHasInstalledAnNcs } from '../util/persistentStore';
import { showFirstInstallOfferDialog } from '../FirstInstall/firstInstallReducer';

const { net } = remote;

export const ENVIRONMENT_LIST_UPDATE = 'ENVIRONMENT_LIST_UPDATE';
export const ENVIRONMENT_IN_PROCESS = 'ENVIRONMENT_IN_PROCESS';

const compareBy = prop => (a, b) => {
    try {
        return -semver.compare(a[prop], b[prop]);
    } catch (_) {
        switch (true) {
            case (a[prop] < b[prop]): return -1;
            case (a[prop] > b[prop]): return 1;
            default: return 0;
        }
    }
};

export const environmentListUpdateAction = environmentList => ({
    type: ENVIRONMENT_LIST_UPDATE,
    environmentList: [...environmentList.sort(compareBy('version'))],
});

export const environmentInProcessAction = isInProcess => ({
    type: ENVIRONMENT_IN_PROCESS,
    isInProcess,
});

export const environmentUpdateAction = environment => (dispatch, getState) => {
    if (!environment) {
        throw new Error('No environment state provided');
    }

    const { environmentList } = getState().app.manager;
    const envIndex = environmentList.findIndex(v => v.version === environment.version);
    if (envIndex < 0) {
        environmentList.push(environment);
    } else {
        environmentList[envIndex] = {
            ...environmentList[envIndex],
            ...environment,
        };
    }
    dispatch(environmentListUpdateAction(environmentList));
};

const toolchainUpdateAction = (
    environmentVersion,
    toolchain,
) => (dispatch, getState) => {
    if (!toolchain) {
        throw new Error('No toolchain state provided');
    }

    const { environmentList } = getState().app.manager;
    const envIndex = environmentList.findIndex(v => v.version === environmentVersion);
    if (envIndex < 0) {
        throw new Error(`No environment version found for ${environmentVersion}`);
    }

    const toolchainList = environmentList[envIndex].toolchainList || [];
    const toolchainIndex = toolchainList.findIndex(v => (v.version === toolchain.version));
    if (toolchainIndex < 0) {
        toolchainList.push(toolchain);
    } else {
        toolchainList[toolchainIndex] = {
            ...toolchainList[toolchainIndex],
            ...toolchain,
        };
    }

    environmentList[envIndex] = {
        ...environmentList[envIndex],
        toolchainList,
    };
    dispatch(environmentListUpdateAction(environmentList));
};

const getEnvironment = (version, getState) => {
    const { environmentList } = getState().app.manager;
    return environmentList.find(v => v.version === version);
};

export const checkLocalEnvironments = () => (dispatch, getState) => {
    dispatch(environmentListUpdateAction([]));
    const { installDir } = getState().app.settings;
    const subDirs = fs.readdirSync(installDir, { withFileTypes: true })
        .filter(dirEnt => dirEnt.isDirectory())
        .map(({ name }) => path.resolve(installDir, name));
    subDirs.map(subDir => fs.readdirSync(path.resolve(installDir, subDir))
        .filter(d => !d.endsWith('.zip'))
        .map(dir => path.resolve(installDir, subDir, dir, 'ncsmgr/manifest.env'))
        .filter(fs.existsSync))
        .flat()
        .forEach(toolchain => {
            const toolchainDir = path.resolve(toolchain, '../..');
            const envDirBasename = path.basename(path.resolve(toolchainDir, '..'));
            const isWestPresent = fs.existsSync(path.resolve(toolchainDir, '../.west/config'));
            dispatch(environmentUpdateAction({
                version: envDirBasename,
                toolchainDir,
                isWestPresent,
            }));
        });
};

export const downloadIndex = () => async (dispatch, getState) => {
    const { toolchainIndexUrl } = getState().app.settings;
    const { status, data } = await new Promise(resolve => {
        const request = net.request({ url: toolchainIndexUrl });
        request.setHeader('pragma', 'no-cache');
        request.on('response', response => {
            let result = '';
            response.on('end', () => {
                resolve({ data: JSON.parse(result), status: response.statusCode });
            });
            response.on('data', buf => {
                result += `${buf}`;
            });
        }).end();
    });

    if (status !== 200) {
        throw new Error(`Unable to download ${toolchainIndexUrl}. Got status code ${status}`);
    }

    data.sort((a, b) => -semver.compare(a.version, b.version));
    data.forEach(environment => {
        const updatedEnvironment = environment;
        const { version, toolchains } = updatedEnvironment;
        delete updatedEnvironment.toolchains;
        dispatch(environmentUpdateAction(updatedEnvironment));
        toolchains.sort(compareBy('name'))
            .forEach(toolchain => {
                dispatch(toolchainUpdateAction(version, toolchain));
            });
    });
};

export const downloadZip = (
    environmentVersion,
    toolchainVersion,
) => (dispatch, getState) => new Promise((resolve, reject) => {
    const { installDir, toolchainIndexUrl } = getState().app.settings;
    const { toolchainList } = getEnvironment(environmentVersion, getState);
    const { name, sha512 } = toolchainList.find(v => v.version === toolchainVersion);

    const hash = createHash('sha512');

    const downloadDir = path.resolve(installDir, 'downloads');
    const zipLocation = path.resolve(downloadDir, name);
    fse.mkdirpSync(downloadDir);
    const writeStream = fs.createWriteStream(zipLocation);

    const url = `${path.dirname(toolchainIndexUrl)}/${name}`;

    net.request({ url }).on('response', response => {
        const totalLength = response.headers['content-length'][0];
        let currentLength = 0;
        response.on('data', data => {
            hash.update(data);
            const updatedEnvironment = getEnvironment(environmentVersion, getState);
            currentLength += data.length;
            writeStream.write(data);
            const progress = Math.round(currentLength / totalLength * 49);

            if (progress !== updatedEnvironment.progress) {
                dispatch(environmentUpdateAction({
                    ...updatedEnvironment,
                    progress,
                }));
            }
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
    environmentVersion,
    src,
    dest,
) => (dispatch, getState) => new Promise(resolve => {
    const unzipper = new DecompressZip(src);
    unzipper.on('error', err => {
        console.log('Caught an error', err);
    });
    unzipper.on('extract', () => {
        const { environmentList } = getState().app.manager;
        const environment = environmentList.find(v => v.version === environmentVersion);
        dispatch(environmentUpdateAction({
            ...environment,
            toolchainDir: dest,
            progress: undefined,
        }));
        resolve();
    });
    unzipper.on('progress', (fileIndex, fileCount) => {
        const { environmentList } = getState().app.manager;
        const environment = environmentList.find(v => v.version === environmentVersion);
        const progress = Math.round((fileIndex) / fileCount * 50) + 49;

        if (progress !== environment.progress) {
            dispatch(environmentUpdateAction({
                ...environment,
                progress,
            }));
        }
    });
    unzipper.extract({ path: dest });
});

export const cloneNcs = version => (dispatch, getState) => new Promise((resolve, reject) => {
    const environment = getEnvironment(version, getState);
    const { toolchainDir } = environment;
    const gitBash = path.resolve(toolchainDir, 'git-bash.exe');
    const initScript = 'unset ZEPHYR_BASE; toolchain/ncsmgr/ncsmgr init-ncs; sleep 3';

    dispatch(environmentUpdateAction({
        ...environment,
        isCloning: true,
    }));
    exec(`"${gitBash}" -c "${initScript}"`, error => {
        if (error) return reject(new Error(`Failed to clone NCS with error: ${error}`));
        dispatch(environmentUpdateAction({
            ...environment,
            isCloning: false,
        }));
        return resolve();
    });
});

export const updateAction = () => dispatch => {
    dispatch(checkLocalEnvironments());
    dispatch(downloadIndex());
};

export const initAction = () => (dispatch, getState) => {
    const { installDir } = getState().app.settings;
    fse.mkdirpSync(installDir);
    dispatch(updateAction());
};

export const install = (environmentVersion, toolchainVersion) => async (dispatch, getState) => {
    const { installDir } = getState().app.settings;
    const toolchainDir = 'toolchain';
    const unzipDest = path.resolve(installDir, environmentVersion, toolchainDir);

    if (isFirstInstall()) {
        dispatch(showFirstInstallOfferDialog(unzipDest));
    }

    dispatch(environmentInProcessAction(true));
    fse.mkdirpSync(unzipDest);
    const zipLocation = await dispatch(downloadZip(environmentVersion, toolchainVersion));
    await dispatch(unzip(environmentVersion, zipLocation, unzipDest));
    await dispatch(cloneNcs(environmentVersion));

    setHasInstalledAnNcs();
    dispatch(updateAction());
    dispatch(environmentInProcessAction(false));
};

export const installLatestToolchain = version => (dispatch, getState) => {
    const toolchain = getEnvironment(version, getState)
        .toolchainList.sort(compareBy('version'))[0];
    dispatch(install(version, toolchain.version));
};

export const openFolder = version => (dispatch, getState) => {
    const { toolchainDir } = getEnvironment(version, getState);
    shell.openItem(path.dirname(toolchainDir));
};

export const openToolchainFolder = version => (dispatch, getState) => {
    const { toolchainDir } = getEnvironment(version, getState);
    shell.openItem(toolchainDir);
};

export const openBash = version => (dispatch, getState) => {
    const { toolchainDir } = getEnvironment(version, getState);
    exec(`"${path.resolve(toolchainDir, 'git-bash.exe')}"`);
};

export const removeToolchain = (version, withParent = false) => async (dispatch, getState) => {
    const environment = getEnvironment(version, getState);
    const { toolchainDir } = environment;
    const toBeDeletedDir = path.resolve(toolchainDir, '..', '..', 'toBeDeleted');
    dispatch(environmentInProcessAction(true));
    dispatch(environmentUpdateAction({
        ...environment,
        isRemoving: true,
    }));

    let updatedToolchainDir;
    try {
        let srcDir;
        if (!withParent) {
            srcDir = toolchainDir;
        } else {
            srcDir = path.dirname(toolchainDir);
        }
        await new Promise((resolve, reject) => {
            fse.move(srcDir, toBeDeletedDir, { overwrite: true }, error => {
                if (error) return reject(error);
                return resolve();
            });
        });
        await fse.remove(toBeDeletedDir);
        updatedToolchainDir = null;
    } catch (error) {
        console.log(`Failed to remove files with error: ${error}`);
        updatedToolchainDir = toolchainDir;
    } finally {
        dispatch(environmentUpdateAction({
            ...environment,
            toolchainDir: updatedToolchainDir,
            isRemoving: false,
        }));
        dispatch(environmentInProcessAction(false));
    }
};

export const removeEnvironment = version => async dispatch => {
    await dispatch(removeToolchain(version, true));
};
