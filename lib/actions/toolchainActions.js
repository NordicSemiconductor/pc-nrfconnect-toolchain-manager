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

import axios from 'axios';
import fs from 'fs';
import semver from 'semver';
import zlib from 'zlib';
import { remote } from 'electron';
import DecompressZip from 'decompress-zip';

const { net } = remote;

export const downloadIndex = async () => {
    const indexUrl = 'https://developer.nordicsemi.com/.pc-tools/toolchain/index.json';
    const response = await axios.get(indexUrl);
    const statusCode = response.status;
    if (statusCode !== 200) {
        throw new Error(`Unable to download ${indexUrl}. `
            + `Got status code ${statusCode}`);
    }
    return response.data;
};

export const downloadBuffer = async url => {
    return new Promise((resolve, reject) => {
        const request = net.request({
            url,
        });

        request.on('response', response => {
            console.log(response);
            const buffer = [];
            const addToBuffer = data => {
                buffer.push(data);
            };
            response.on('data', data => addToBuffer(data));
            response.on('data', console.log);
            response.on('end', () => resolve(Buffer.concat(buffer)));
            response.on('error', error => reject(new Error(`Error when reading ${url}: `
                + `${error.message}`)));
        });
        request.on('error', error => reject(new Error(`unable to download ${url}: `
        + `${error.message}`)));
        request.end();
    });
};

export const unzip = (src, dest) => {
    // console.log(src);
    // const inputStream = fs.createReadStream(src);
    // const outpuStream = fs.createWriteStream(dest, { type: 'Directory' });
    // const gnuZip = zlib.createGunzip();
    // inputStream.pipe(gnuZip).pipe(outpuStream);
    const unzipper = new DecompressZip(src);
    unzipper.on('error', function (err) {
        console.log('Caught an error', err);
    });

    // Notify when everything is extracted
    unzipper.on('extract', function (log) {
        console.log('Finished extracting', log);
    });

    // Notify "progress" of the decompressed files
    unzipper.on('progress', function (fileIndex, fileCount) {
        console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
    });

    // Start extraction of the content
    unzipper.extract({
        path: dest,
        // You can filter the files that you want to unpack using the filter option
        //filter: function (file) {
            //console.log(file);
            //return file.type !== "SymbolicLink";
        //}
    });
};


export const installLatest = async () => {
    const toolchainList = await downloadIndex();
    toolchainList.sort((a, b) => -semver.compare(a.version, b.version));
    const latest = toolchainList[0];
    const downloadUrl = latest.url;
    // const buffer = await downloadBuffer(downloadUrl);
    // console.log(buffer);
    // fs.writeFileSync('/tmp/test.zip', buffer);
    unzip('/tmp/test.zip', '/tmp/test');
};
