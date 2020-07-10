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
import { execSync } from 'child_process';

import { remote } from 'electron';
import fse from 'fs-extra';
import { toolchainIndexUrl, persistedInstallDir as installDir } from '../persistentStore';
import { isWestPresent } from './Environment/environmentEffects';
import { addEnvironment, addLocallyExistingEnvironment, clearEnvironments } from './managerReducer';

const detectLocallyExistingEnvironments = dispatch => {
    fs.readdirSync(installDir(), { withFileTypes: true })
        .filter(dirEnt => dirEnt.isDirectory())
        .map(({ name }) => ({
            version: name,
            toolchainDir: path.resolve(installDir(), name, 'toolchain'),
        }))
        .filter(({ toolchainDir }) => fs.existsSync(path.resolve(toolchainDir, 'ncsmgr/manifest.env')))
        .forEach(({ version, toolchainDir }) => {
            dispatch(addLocallyExistingEnvironment(
                version,
                toolchainDir,
                isWestPresent(toolchainDir),
            ));
        });
};

const downloadIndex = dispatch => {
    const request = remote.net.request({ url: toolchainIndexUrl() });
    request.setHeader('pragma', 'no-cache');
    request.on('response', response => {
        let result = '';
        response.on('end', () => {
            if (response.statusCode !== 200) {
                console.error(`Unable to download ${toolchainIndexUrl()}. Got status code ${response.statusCode}`);
                return;
            }

            JSON.parse(result)
                .forEach(environment => dispatch(addEnvironment(environment)));
        });
        response.on('data', buf => {
            result += `${buf}`;
        });
    });
    request.end();
};

export default dispatch => {
    const dir = path.dirname(installDir());
    if (process.platform === 'darwin'
        // eslint-disable-next-line no-bitwise
        && (!fs.existsSync(dir) || (fs.statSync(dir).mode & 0o3775) !== 0o3775)) {
        const prompt = `Base directory ${dir} needs to be created, to do this please...`;
        const script = `install -d -g staff -m 3775 ${dir}`;
        execSync(`osascript -e "do shell script \\"${script} \\" with prompt \\"${prompt} \\" with administrator privileges"`);
    }
    fse.mkdirpSync(installDir());
    dispatch(clearEnvironments());
    detectLocallyExistingEnvironments(dispatch);
    downloadIndex(dispatch);
};
