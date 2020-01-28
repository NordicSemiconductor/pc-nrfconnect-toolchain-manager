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
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

import axios from 'axios';
import DecompressZip from 'decompress-zip';
import { remote } from 'electron';
import semver from 'semver';

const { net } = remote;

export const TOOLCHAIN_LIST_UPDATE = 'TOOLCHAIN_LIST_UPDATE';
export const TOOLCHAIN_LATEST_UPDATE = 'TOOLCHAIN_LATEST_UPDATE';
export const TOOLCHAIN_DIR_UPDATE = 'TOOLCHAIN_DIR_UPDATE';
export const TOOLCHAIN_PROGRESS_UPDATE = 'TOOLCHAIN_PROGRESS_UPDATE';

export const toolchainListUpdateAction = toolchainList => ({
    type: TOOLCHAIN_LIST_UPDATE,
    toolchainList,
});

export const toolchainLatestUpdateAction = version => ({
    type: TOOLCHAIN_LATEST_UPDATE,
    version,
});

export const toolchainDirUpdateAction = (version, dir) => ({
    type: TOOLCHAIN_DIR_UPDATE,
    version,
    dir,
});

export const toolchainProgressUpdateAction = (version, progress) => ({
    type: TOOLCHAIN_PROGRESS_UPDATE,
    version,
    progress,
});

export const toolchainUpdateAction = (ncsVersion, toolchain) => (dispatch, getState) => {
    const { versionList } = getState().app.toolchain;
    const ncsIndex = versionList.findIndex(v => v.version === ncsVersion);
    if (ncsIndex < 0) {
        versionList.push({
            version: ncsVersion,
            toolchains: [toolchain],
        });
    } else {
        const ncs = versionList[ncsIndex];
        const { toolchains } = ncs;
        const toolchainIndex = toolchains.findIndex(v => v.version === toolchain.version);
        if (toolchainIndex < 0) {
            toolchains.push(toolchain);
        } else {
            toolchains[toolchainIndex] = {
                ...toolchains[toolchainIndex],
                ...toolchain,
            };
        }

        versionList[ncsIndex] = {
            ...versionList[ncsIndex],
            ...toolchains,
        };
    }
    dispatch(toolchainListUpdateAction([...versionList]));
};

const compareBy = prop => (a, b) => {
    switch (true) {
        case (a[prop] < b[prop]): return -1;
        case (a[prop] > b[prop]): return 1;
        default: return 0;
    }
};

export const downloadIndex = () => async dispatch => {
    const indexUrl = 'https://developer.nordicsemi.com/.pc-tools/toolchain/index.json';
    const { status, data } = await axios.get(indexUrl);

    if (status !== 200) {
        throw new Error(`Unable to download ${indexUrl}. `
            + `Got status code ${status}`);
    }
    data.sort((a, b) => -semver.compare(a.version, b.version));
    data.forEach(ncs => {
        const { version, toolchains } = ncs;
        toolchains.sort(compareBy('name'))
            .forEach(toolchain => {
                dispatch(toolchainUpdateAction(version, toolchain));
            });
    });
    // dispatch(toolchainLatestUpdateAction(data[0].version));
};

export const checkLocalToolchains = () => (dispatch, getState) => {
    const { installDir } = getState().app.toolchain;
    const subDirs = fs.readdirSync(installDir).map(dir => path.resolve(installDir, dir));
    subDirs.map(subDir => fs.readdirSync(path.resolve(installDir, subDir))
        .filter(d => !d.endsWith('.zip'))
        .map(dir => path.resolve(installDir, subDir, dir, 'ncsmgr/manifest.env'))
        .filter(fs.existsSync))
        .flat()
        .forEach(toolchain => {
            const toolchainDir = path.resolve(toolchain, '../..');
            const ncsDirBasename = path.basename(path.resolve(toolchainDir, '..'));
            dispatch(toolchainUpdateAction(ncsDirBasename, {
                toolchainDir,
                version: path.basename(path.dirname(toolchainDir)),
            }));
        });
};

export const downloadZip = version => (dispatch, getState) => new Promise((resolve, reject) => {
    const { versionList, installDir } = getState().app.toolchain;
    const toolchain = versionList.find(v => v.version === version);
    const { url } = toolchain;
    const request = net.request({
        url,
    });
    const zipLocation = path.resolve(installDir, 'downloads', path.basename(url));
    const writeStream = fs.createWriteStream(zipLocation);
    request.on('response', response => {
        const totalLength = response.headers['content-length'][0];
        let currentLength = 0;
        response.on('data', data => {
            const { versionList: updatedVersionList } = getState().app.toolchain;
            const updatedToolchain = updatedVersionList.find(v => v.version === version);
            currentLength += data.length;
            writeStream.write(data);
            const progress = Math.round(currentLength / totalLength * 50);

            if (progress !== updatedToolchain.progress) {
                dispatch(toolchainUpdateAction({
                    ...updatedToolchain,
                    progress,
                }));
            }
        });
        response.on('end', () => { writeStream.end(() => resolve(zipLocation)); });
        response.on('error', error => reject(new Error(`Error when reading ${url}: `
            + `${error.message}`)));
    });
    request.on('error', error => reject(new Error(`unable to download ${url}: `
    + `${error.message}`)));
    request.end();
});

export const unzip = (version, src, dest) => (dispatch, getState) => new Promise(resolve => {
    const unzipper = new DecompressZip(src);
    unzipper.on('error', err => {
        console.log('Caught an error', err);
    });
    unzipper.on('extract', log => {
        console.log('Finished extracting', log);
        const { versionList } = getState().app.toolchain;
        const updatedToolchain = versionList.find(v => v.version === version);
        dispatch(toolchainUpdateAction({
            ...updatedToolchain,
            progress: undefined,
        }));
        dispatch(checkLocalToolchains());
        resolve();
    });
    unzipper.on('progress', (fileIndex, fileCount) => {
        const { versionList } = getState().app.toolchain;
        const updatedToolchain = versionList.find(v => v.version === version);
        const progress = Math.round((fileIndex) / fileCount * 50) + 50;

        if (progress !== updatedToolchain.progress) {
            console.log(progress);
            dispatch(toolchainUpdateAction({
                ...updatedToolchain,
                progress,
            }));
        }
    });
    unzipper.extract({ path: dest });
});

export const install = (ncsVersion, toolchainVersion) => async (dispatch, getState) => {
    const { installDir } = getState().app.toolchain;
    const ncsPath = path.resolve(installDir, ncsVersion);
    fs.mkdirSync(ncsPath);
    const unzipDest = path.resolve(ncsPath, toolchainVersion);
    fs.mkdirSync(unzipDest);
    // const zipLocation = await dispatch(downloadZip(ncsVersion, toolchainVersion));
    // await dispatch(unzip(ncsVersion, toolchainVersion, zipLocation, unzipDest));
    // dispatch(toolchainDirUpdateAction(ncsVersion, toolchainVersion, unzipDest));
};

export const installLatestToolchain = ncsVersion => (dispatch, getState) => {
    const { versionList } = getState().app.toolchain;
    const ncs = versionList.find(v => v.version === ncsVersion);
    const toolchain = ncs.toolchains.sort(compareBy('name'))[0];
    dispatch(install(ncsVersion, toolchain.version));
};

export const open = version => (dispatch, getState) => {
    const { versionList } = getState().app.toolchain;
    const toolchain = versionList.find(v => v.version === version);
    const { toolchainDir } = toolchain;
    exec(`"${path.resolve(toolchainDir, 'SEGGER Embedded Studio.cmd')}"`);
};

export const openLatest = () => (dispatch, getState) => {
    const { latest } = getState().app.toolchain;
    dispatch(open(latest));
};

export const initAction = () => dispatch => {
    dispatch(checkLocalToolchains());
    dispatch(downloadIndex());
};

export const removeToolchain = version => async (dispatch, getState) => {
    const { versionList } = getState().app.toolchain;
    const toolchain = versionList.find(v => v.version === version);
    const { toolchainDir } = toolchain;
    dispatch(toolchainUpdateAction({
        ...toolchain,
        isRemoving: true,
    }));
    await fse.remove(toolchainDir);
    dispatch(toolchainUpdateAction({
        ...toolchain,
        toolchainDir: null,
        isRemoving: false,
    }));
};

export const cloneNcs = version => (dispatch, getState) => {
    const { versionList } = getState().app.toolchain;
    const toolchain = versionList.find(v => v.version === version);
    const { toolchainDir } = toolchain;
    console.log('clone');
    exec(`"${path.resolve(toolchainDir, 'git-bash.exe')}" -c "unset ZEPHYR_BASE; west init -m https://github.com/NordicPlayground/fw-nrfconnect-nrf --mr ${version}; west update; sleep 10"`);
};
