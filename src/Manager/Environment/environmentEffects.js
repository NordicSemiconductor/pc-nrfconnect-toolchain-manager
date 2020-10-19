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

import { execSync, spawn } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import DecompressZip from 'decompress-zip';
import { remote } from 'electron';
import fse from 'fs-extra';
import {
    isFirstInstall,
    setHasInstalledAnNcs,
    toolchainUrl,
    persistedInstallDir as installDir,
} from '../../persistentStore';
import { showFirstInstallDialog } from '../../FirstInstall/firstInstallReducer';
import { showErrorDialog } from '../../launcherActions';

import {
    selectEnvironment,
    getLatestToolchain,
    getEnvironment,
    addLocallyExistingEnvironment,
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

const sudo = remote.require('sudo-prompt');
const { spawn: remoteSpawn } = remote.require('child_process');

const DOWNLOAD = 0;
const UNPACK = 50;

const reportProgress = (version, currentValue, maxValue, half) => (
    dispatch,
    getState
) => {
    const prevProgress = progress(getEnvironment(getState(), version));
    const newProgress = Math.round((currentValue / maxValue) * 50) + half;

    if (newProgress !== prevProgress) {
        const stage = half === DOWNLOAD ? 'Downloading' : 'Installing';
        dispatch(setProgress(version, stage, newProgress));
    }
};

const download = (version, { name, sha512, uri }) => async dispatch =>
    new Promise((resolve, reject) => {
        const hash = createHash('sha512');

        const url = uri || toolchainUrl(name);
        const filename = name || path.basename(url);

        const downloadDir = path.resolve(installDir(), 'downloads');
        const packageLocation = path.resolve(downloadDir, filename);
        fse.mkdirpSync(downloadDir);
        const writeStream = fs.createWriteStream(packageLocation);

        remote.net
            .request({ url })
            .on('response', response => {
                const totalLength = response.headers['content-length'][0];
                let currentLength = 0;
                response.on('data', data => {
                    hash.update(data);
                    writeStream.write(data);

                    currentLength += data.length;
                    dispatch(
                        reportProgress(
                            version,
                            currentLength,
                            totalLength,
                            DOWNLOAD
                        )
                    );
                });
                response.on('end', () => {
                    writeStream.end(() => {
                        const hex = hash.digest('hex');
                        if (sha512 && hex !== sha512) {
                            return reject(
                                new Error(`Checksum verification failed ${url}`)
                            );
                        }
                        return resolve(packageLocation);
                    });
                });
                response.on('error', error =>
                    reject(
                        new Error(`Error when reading ${url}: ${error.message}`)
                    )
                );
            })
            .on('error', error =>
                reject(new Error(`Unable to download ${url}: ${error.message}`))
            )
            .end();
    });

const unpack = (version, src, dest) => async dispatch => {
    switch (process.platform) {
        case 'win32':
            return new Promise((resolve, reject) =>
                new DecompressZip(src)
                    .on('error', reject)
                    .on('extract', resolve)
                    .on('progress', (fileIndex, fileCount) =>
                        dispatch(
                            reportProgress(
                                version,
                                fileIndex,
                                fileCount,
                                UNPACK
                            )
                        )
                    )
                    .extract({ path: dest })
            );
        case 'darwin': {
            const volume = execSync(
                `hdiutil attach ${src} | grep -Eo "/Volumes/ncs-toolchain-.*"`
            )
                .toString()
                .trim();
            let n = 0;
            await fse.copy(path.join(volume, 'toolchain'), dest, {
                filter: () => {
                    n += 1;
                    dispatch(reportProgress(version, n, 57000, UNPACK));
                    return true;
                },
            });
            execSync(`hdiutil detach ${volume}`);
            break;
        }
        case 'linux': {
            dispatch(setProgress(version, 'Installing...', 51));
            await new Promise((resolve, reject) =>
                sudo.exec(
                    `snap install ${src} --devmode`,
                    { name: 'Toolchain Manager' },
                    err => (err ? reject(err) : resolve())
                )
            );
            dispatch(setProgress(version, 'Installing...', 99));
            fse.removeSync(dest);
            const shortVer = version.replace(/\./g, '');
            fse.symlinkSync(`/snap/ncs-toolchain-${shortVer}/current`, dest);
            break;
        }
        default:
    }
    return undefined;
};

const installToolchain = (
    version,
    toolchain,
    toolchainDir
) => async dispatch => {
    dispatch(startInstallToolchain(version));

    try {
        fse.mkdirpSync(toolchainDir);
        const packageLocation = await dispatch(download(version, toolchain));
        await dispatch(unpack(version, packageLocation, toolchainDir));
    } catch (error) {
        dispatch(showErrorDialog(`${error.message || error}`));
    }

    dispatch(finishInstallToolchain(version, toolchainDir));
};

export const isWestPresent = toolchainDir =>
    fs.existsSync(path.resolve(toolchainDir, '../.west/config'));

export const cloneNcs = (
    version,
    toolchainDir,
    justUpdate
) => async dispatch => {
    dispatch(startCloningSdk(version));

    if (!justUpdate) {
        await fse.remove(path.resolve(path.dirname(toolchainDir), '.west'));
    }
    try {
        let ncsMgr;
        const update = justUpdate ? '--just-update' : '';
        switch (process.platform) {
            case 'win32': {
                ncsMgr = spawn(path.resolve(toolchainDir, 'bin', 'bash.exe'), [
                    '-l',
                    '-c',
                    `unset ZEPHYR_BASE ; ncsmgr/ncsmgr init-ncs ${update}`,
                ]);

                break;
            }
            case 'darwin': {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { ZEPHYR_BASE, ...env } = process.env;
                const gitversion = fs
                    .readdirSync(`${toolchainDir}/Cellar/git`)
                    .pop();
                env.PATH = `${toolchainDir}/bin:${remote.process.env.PATH}`;
                env.GIT_EXEC_PATH = `${toolchainDir}/Cellar/git/${gitversion}/libexec/git-core`;

                ncsMgr = spawn(
                    `${toolchainDir}/ncsmgr/ncsmgr`,
                    ['init-ncs', `${update}`],
                    { env }
                );
                break;
            }
            case 'linux': {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { ZEPHYR_BASE, ...env } = process.env;
                env.PATH = `${toolchainDir}/bin:${remote.process.env.PATH}`;
                const shortVer = version.replace(/\./g, '');

                ncsMgr = remoteSpawn(
                    'snap',
                    [
                        'run',
                        '--shell',
                        `ncs-toolchain-${shortVer}.west`,
                        '-c',
                        `${toolchainDir}/ncsmgr/ncsmgr init-ncs ${update}`,
                    ],
                    { env }
                );
                break;
            }
            default:
        }

        dispatch(setProgress(version, 'Initializing environment...'));
        let err = '';
        await new Promise((resolve, reject) => {
            ncsMgr.stdout.on('data', data => {
                const repo = (
                    /=== updating (\w+)/.exec(data.toString()) || []
                ).pop();
                if (repo) {
                    dispatch(
                        setProgress(version, `Updating ${repo} repository...`)
                    );
                }
            });
            ncsMgr.stderr.on('data', data => {
                err += `${data}`;
            });
            ncsMgr.on('exit', code => (code ? reject(err) : resolve()));
        });
    } catch (error) {
        dispatch(showErrorDialog(`Failed to clone the repositories: ${error}`));
    }

    dispatch(finishCloningSdk(version, isWestPresent(toolchainDir)));
};

export const install = (
    { version, toolchains },
    justUpdate
) => async dispatch => {
    const toolchain = getLatestToolchain(toolchains);
    const toolchainDir = path.resolve(installDir(), version, 'toolchain');

    dispatch(selectEnvironment(version));
    if (isFirstInstall()) {
        dispatch(showFirstInstallDialog());
    }
    setHasInstalledAnNcs();

    await dispatch(installToolchain(version, toolchain, toolchainDir));
    await dispatch(cloneNcs(version, toolchainDir, justUpdate));
};

export const remove = ({ toolchainDir, version }) => async dispatch => {
    const toBeDeletedDir = path.resolve(
        toolchainDir,
        '..',
        '..',
        'toBeDeleted'
    );
    dispatch(startRemoving(version));

    const srcDir = path.dirname(toolchainDir);
    let renameOfDirSuccessful = false;
    try {
        await fse.move(srcDir, toBeDeletedDir, { overwrite: true });
        renameOfDirSuccessful = true;
        await fse.remove(toBeDeletedDir);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        dispatch(
            showErrorDialog(
                `Failed to remove ${srcDir}, ${message}. ` +
                    'Please close any application or window that might keep this ' +
                    'environment locked, then try to remove it again.'
            )
        );
    }
    if (renameOfDirSuccessful) {
        dispatch(removeEnvironment(version));
    }

    dispatch(finishRemoving(version));
};

export const installPackage = urlOrFilePath => async dispatch => {
    const match = /ncs-toolchain-(v?.+?)([-_]\d{8}-[^.]+).[zip|dmg|snap]/.exec(
        urlOrFilePath
    );
    if (!match) {
        dispatch(
            showErrorDialog(
                'Filename is not recognized as a toolchain package.'
            )
        );
        return;
    }
    const version = match[1];
    const toolchainDir = path.resolve(installDir(), version, 'toolchain');
    fse.mkdirpSync(toolchainDir);

    dispatch(
        addLocallyExistingEnvironment(version, toolchainDir, false, false)
    );
    dispatch(startInstallToolchain(version));

    try {
        const filePath = fse.existsSync(urlOrFilePath)
            ? urlOrFilePath
            : await dispatch(download(version, { uri: urlOrFilePath }));

        await dispatch(unpack(version, filePath, toolchainDir));
        dispatch(finishInstallToolchain(version, toolchainDir));
        await dispatch(cloneNcs(version, toolchainDir, false));
    } catch (error) {
        dispatch(showErrorDialog(`${error.message || error}`));
    }
};
