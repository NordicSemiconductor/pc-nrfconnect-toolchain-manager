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
import path from 'path';

import axios from 'axios';
import DecompressZip from 'decompress-zip';
import { remote } from 'electron';
import semver from 'semver';

const { net } = remote;

export const TOOLCHAIN_LIST_UPDATE = 'TOOLCHAIN_LIST_UPDATE';
export const TOOLCHAIN_LATEST_UPDATE = 'TOOLCHAIN_LATEST_UPDATE';

export const toolchainListUpdateAction = toolchainList => ({
    type: TOOLCHAIN_LIST_UPDATE,
    toolchainList,
});

export const toolchainLatestUpdateAction = toolchain => ({
    type: TOOLCHAIN_LATEST_UPDATE,
    toolchain,
});


export const downloadIndex = () => async dispatch => {
    const indexUrl = 'https://developer.nordicsemi.com/.pc-tools/toolchain/index.json';
    const { status, data } = await axios.get(indexUrl);

    if (status !== 200) {
        throw new Error(`Unable to download ${indexUrl}. `
            + `Got status code ${status}`);
    }
    data.sort((a, b) => -semver.compare(a.version, b.version));
    dispatch(toolchainListUpdateAction(data));
    dispatch(toolchainLatestUpdateAction(data[0]));
};

export const downloadZip = url => (dispatch, getState) => new Promise((resolve, reject) => {
    const request = net.request({
        url,
    });
    const { installDir } = getState().app.toolchain;
    const zipLocation = path.resolve(installDir, 'downloads', path.basename(url));
    const writeStream = fs.createWriteStream(zipLocation);
    request.on('response', response => {
        const totalLength = response.headers['content-length'][0];
        let currentLength = 0;
        response.on('data', data => {
            currentLength += data.length;
            writeStream.write(data);
            console.log(`${Math.round(currentLength / totalLength * 100)}%`);
        });
        response.on('end', () => { writeStream.end(() => resolve(zipLocation)); });
        response.on('error', error => reject(new Error(`Error when reading ${url}: `
            + `${error.message}`)));
    });
    request.on('error', error => reject(new Error(`unable to download ${url}: `
    + `${error.message}`)));
    request.end();
});

export const unzip = (src, dest) => {
    const unzipper = new DecompressZip(src);
    unzipper.on('error', err => {
        console.log('Caught an error', err);
    });
    unzipper.on('extract', log => {
        console.log('Finished extracting', log);
    });
    unzipper.on('progress', (fileIndex, fileCount) => {
        console.log(`Extracted file ${fileIndex + 1} of ${fileCount}`);
    });
    unzipper.extract({ path: dest });
};


export const installLatest = () => async (dispatch, getState) => {
    const { latest, installDir } = getState().app.toolchain;
    const downloadUrl = latest.url;
    const unzipDest = path.resolve(installDir, latest.version);

    const zipLocation = await dispatch(downloadZip(downloadUrl));
    unzip(zipLocation, unzipDest);
};

export const openLatest = () => dispatch => {
    exec('"C:/Users/chfa/Downloads/test/SEGGER EmbeddedStudio.cmd"');
};

export const open = version => (dispatch, getState) => {
    const { versionList } = getState().app.toolchain;
    const toolchain = versionList.find(v => v.version === version);
    exec();
};

