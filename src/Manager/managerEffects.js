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

import fs from 'fs';
import path from 'path';

import { remote } from 'electron';
import fse from 'fs-extra';
import { toolchainIndexUrl, installDir } from '../persistentStore';
import { addEnvironment } from './managerReducer';

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
            const version = path.basename(path.resolve(toolchainDir, '..'));
            const isWestPresent = fs.existsSync(path.resolve(toolchainDir, '../.west/config'));
            dispatch(addEnvironment({
                version,
                toolchainDir,
                isWestPresent,
            }));
        });
};

export const downloadIndex = () => dispatch => new Promise((resolve, reject) => {
    remote.net.request({ url: toolchainIndexUrl() })
        .setHeader('pragma', 'no-cache')
        .on('response', response => {
            let result = '';
            response.on('end', () => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Unable to download ${toolchainIndexUrl()}. Got status code ${response.statusCode}`));
                }

                JSON.parse(result)
                    .forEach(environment => dispatch(addEnvironment(environment)));
                resolve();
            });
            response.on('data', buf => {
                result += `${buf}`;
            });
        })
        .end();
});

export const init = () => dispatch => {
    fse.mkdirpSync(installDir());
    dispatch(checkLocalEnvironments());
    dispatch(downloadIndex());
};
