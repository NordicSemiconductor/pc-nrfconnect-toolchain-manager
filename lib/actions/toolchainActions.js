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

export const downloadIndex = async () => {
    const indexUrl = 'https://developer.nordicsemi.com/.pc-tools/toolchain/index.json';
    const response = await axios.get(indexUrl);
    const statusCode = response.status;
    if (statusCode !== 200) {
        throw new Error(`Unable to download ${url} with fileid ${fileid}. `
            + `Got status code ${statusCode}`);
    }
    return response.data;
};

export const downloadZip = async url => {
    // const indexUrl = 'https://developer.nordicsemi.com/.pc-tools/toolchain/index.zip';
    const response = await axios.get(
        url,
        null,
        {
            responseType: 'blob',
        },
    );
    const statusCode = response.status;
    if (statusCode !== 200) {
        throw new Error(`Unable to download ${url}. Got status code ${statusCode}`);
    }
    fs.writeFileSync('/tmp/test.zip', response.data);
};


export const installLatest = async () => {
    const toolchainList = await downloadIndex();
    toolchainList.sort((a, b) => -semver.compare(a.version, b.version));
    const latest = toolchainList[0];
    const downloadUrl = latest.url;
    downloadZip(downloadUrl);
};
