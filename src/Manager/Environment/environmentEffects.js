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

import { remote } from 'electron';
import extract from 'extract-zip';
import fse from 'fs-extra';
import { logger } from 'pc-nrfconnect-shared';

import { showFirstInstallDialog } from '../../FirstInstall/firstInstallReducer';
import { showErrorDialog } from '../../launcherActions';
import {
    persistedInstallDir as installDir,
    isFirstInstall,
    setHasInstalledAnNcs,
    toolchainUrl,
} from '../../persistentStore';
import {
    EventAction,
    sendErrorReport,
    sendUsageData,
} from '../../usageDataActions';
import {
    addLocallyExistingEnvironment,
    getEnvironment,
    getLatestToolchain,
    selectEnvironment,
} from '../managerReducer';
import {
    finishCloningSdk,
    finishInstallToolchain,
    finishRemoving,
    progress,
    removeEnvironment,
    setProgress,
    startCloningSdk,
    startInstallToolchain,
    startRemoving,
} from './environmentReducer';
import { updateConfigFile } from './segger';
import { showReduxConfirmDialogAction } from '../../ReduxConfirmDialog/reduxConfirmDialogReducer';

const sudo = remote.require('sudo-prompt');
const { spawn: remoteSpawn } = remote.require('child_process');

const DOWNLOAD = 0;
const UNPACK = 50;

const calculateTimeConsumed = timeStart =>
    Math.round((new Date() - timeStart) / 1000 / 60);

const reportProgress = (version, currentValue, maxValue, half) => (
    dispatch,
    getState
) => {
    const prevProgress = progress(getEnvironment(getState(), version));
    const newProgress = Math.min(
        100,
        Math.round((currentValue / maxValue) * 50) + half
    );

    if (newProgress !== prevProgress) {
        const stage = half === DOWNLOAD ? 'Downloading' : 'Installing';
        dispatch(setProgress(version, stage, newProgress));
    }
};

const download = (version, { name, sha512, uri }) => async dispatch =>
    new Promise((resolve, reject) => {
        logger.info(`Downloading toolchain ${version}`);
        dispatch(setProgress(version, 'Downloading', 0));
        const hash = createHash('sha512');

        const url = uri || toolchainUrl(name);
        const filename = name || path.basename(url);
        sendUsageData(EventAction.DOWNLOAD_TOOLCHAIN, url);

        const downloadDir = path.resolve(installDir(), 'downloads');
        const packageLocation = path.resolve(downloadDir, filename);
        fse.mkdirpSync(downloadDir);
        const writeStream = fs.createWriteStream(packageLocation);

        const downloadTimeStart = new Date();
        remote.net
            .request({ url })
            .on('response', response => {
                const totalLength = response.headers['content-length'];
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
                        sendUsageData(
                            EventAction.DOWNLOAD_TOOLCHAIN_SUCCESS,
                            url
                        );
                        sendUsageData(
                            EventAction.DOWNLOAD_TOOLCHAIN_TIME,
                            `${calculateTimeConsumed(
                                downloadTimeStart
                            )} min; ${url}`
                        );
                        logger.info(
                            `Finished downloading version ${version} of the toolchain after approximately ${calculateTimeConsumed(
                                downloadTimeStart
                            )} minute(s)`
                        );
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
    logger.info(`Unpacking toolchain ${version}`);
    sendUsageData(
        EventAction.UNPACK_TOOLCHAIN,
        `${version}; ${process.platform}; ${process.arch}`
    );
    const unpackTimeStart = new Date();
    dispatch(setProgress(version, 'Installing...', 50));
    switch (process.platform) {
        case 'win32': {
            let fileCount = 0;
            const totalFileCount = 26000; // ncs 1.4 has 25456 files
            await extract(src, {
                dir: dest,
                onEntry: () => {
                    fileCount += 1;
                    dispatch(
                        reportProgress(
                            version,
                            fileCount,
                            totalFileCount,
                            UNPACK
                        )
                    );
                },
            });
            break;
        }
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
                    dispatch(reportProgress(version, n, 63000, UNPACK));
                    return true;
                },
            });
            execSync(`hdiutil detach ${volume}`);
            break;
        }
        case 'linux': {
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

    const unpackInfo = `${version}; ${process.platform}; ${process.arch}`;
    sendUsageData(EventAction.UNPACK_TOOLCHAIN_SUCCESS, unpackInfo);
    sendUsageData(
        EventAction.UNPACK_TOOLCHAIN_TIME,
        `${calculateTimeConsumed(unpackTimeStart)} min; ${unpackInfo}`
    );
    logger.info(
        `Finished unpacking version ${unpackInfo} of the toolchain after approximately ${calculateTimeConsumed(
            unpackTimeStart
        )} minute(s)`
    );

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
        updateConfigFile(toolchainDir);
    } catch (error) {
        dispatch(showErrorDialog(`${error.message || error}`));
        sendErrorReport(error.message || error);
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
    logger.info(`Cloning nRF Connect SDK ${version}`);
    sendUsageData(
        EventAction.CLONE_NCS,
        `${version}; ${process.platform}; ${process.arch}`
    );
    const cloneTimeStart = new Date();

    try {
        if (!justUpdate) {
            await fse.remove(path.resolve(path.dirname(toolchainDir), '.west'));
        }

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
                env.HOME = `${remote.process.env.HOME}`;

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
                env.PATH = `${toolchainDir}/bin:${toolchainDir}/usr/bin:${remote.process.env.PATH}`;
                env.PYTHONHOME = `${toolchainDir}/lib/python3.8`;
                env.PYTHONPATH = `${toolchainDir}/usr/lib/python3.8:${toolchainDir}/lib/python3.8/site-packages:${toolchainDir}/usr/lib/python3/dist-packages:${toolchainDir}/usr/lib/python3.8/lib-dynload`;
                env.GIT_EXEC_PATH = `${toolchainDir}/usr/lib/git-core`;
                env.LD_LIBRARY_PATH = `/var/lib/snapd/lib/gl:/var/lib/snapd/lib/gl32:/var/lib/snapd/void:${toolchainDir}/lib/python3.8/site-packages/.libs_cffi_backend:${toolchainDir}/lib/python3.8/site-packages/Pillow.libs:${toolchainDir}/lib/x86_64-linux-gnu:${toolchainDir}/segger_embedded_studio/bin:${toolchainDir}/usr/lib/x86_64-linux-gnu:${toolchainDir}/lib:${toolchainDir}/usr/lib:${toolchainDir}/lib/x86_64-linux-gnu:${toolchainDir}/usr/lib/x86_64-linux-gnu`;

                ncsMgr = remoteSpawn(
                    `${toolchainDir}/ncsmgr/ncsmgr`,
                    ['init-ncs', `${update}`],
                    { env }
                );
                break;
            }
            default:
        }

        dispatch(setProgress(version, 'Initializing environment...'));
        logger.info(`Initializing environment for ${version}`);
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
                    logger.info(`Updating ${repo} repository for ${version}`);
                }
            });
            ncsMgr.stderr.on('data', data => {
                err += `${data}`;
            });
            ncsMgr.on('exit', code => (code ? reject(err) : resolve()));
        });
    } catch (error) {
        const errorMsg = `Failed to clone the repositories: ${error}`;
        dispatch(showErrorDialog(errorMsg));
        sendErrorReport(errorMsg);
    }

    dispatch(finishCloningSdk(version, isWestPresent(toolchainDir)));
    sendUsageData(
        EventAction.CLONE_NCS_SUCCESS,
        `${version}; ${process.platform}; ${process.arch}`
    );
    sendUsageData(
        EventAction.CLONE_NCS_TIME,
        `${calculateTimeConsumed(cloneTimeStart)} min; ${version}`
    );
    logger.info(
        `Finished cloning version ${version} of the nRF Connect SDK after approximately ${calculateTimeConsumed(
            cloneTimeStart
        )} minute(s)`
    );
};

const showReduxConfirmDialog = ({ ...args }) => dispatch =>
    new Promise((resolve, reject) => {
        dispatch(
            showReduxConfirmDialogAction({
                callback: err => (err ? reject() : resolve()),
                ...args,
            })
        );
    });

const confirmRemoveDir = dir => dispatch =>
    dispatch(
        showReduxConfirmDialog({
            title: 'Inconsistent directory structure',
            content:
                `The \`${dir}\` directory blocks installation, it should be removed.\n\n` +
                'If this directory is part of manually installed nRF Connect SDK environment, ' +
                'consider changing the installation directory in SETTINGS.\n\n' +
                'If this directory is left over from an incorrect installation, click _Remove_.\n\n' +
                'Should you intend to manually remedy the issue, click _Open folder_. ' +
                'Make sure hidden items are visible.',
            confirmLabel: 'Remove',
            onOptional: () => remote.shell.showItemInFolder(dir),
            optionalLabel: 'Open folder',
        })
    );

const ensureCleanTargetDir = toolchainDir => async dispatch => {
    let dir = toolchainDir;
    let toBeDeleted = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const westdir = path.resolve(dir, '.west');
        if (fs.existsSync(westdir)) {
            toBeDeleted = westdir;
            break;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    if (toBeDeleted) {
        try {
            await dispatch(confirmRemoveDir(toBeDeleted));
            await dispatch(removeDir(toBeDeleted));
        } catch (err) {
            throw new Error(
                `${toBeDeleted} must be removed to continue installation`
            );
        }
        await dispatch(ensureCleanTargetDir(toolchainDir));
    }
};

export const install = (
    { version, toolchains },
    justUpdate
) => async dispatch => {
    logger.info(`Start to install toolchain ${version}`);
    const toolchain = getLatestToolchain(toolchains);
    const toolchainDir = path.resolve(installDir(), version, 'toolchain');
    logger.info(`Installing ${toolchain.name} at ${toolchainDir}`);
    logger.debug(`Install with toolchain version ${toolchain.version}`);
    logger.debug(`Install with sha512 ${toolchain.sha512}`);
    sendUsageData(
        EventAction.INSTALL_TOOLCHAIN_FROM_INDEX,
        `${version}; ${toolchain.name}`
    );

    dispatch(selectEnvironment(version));
    if (isFirstInstall()) {
        logger.info(`Show first install dialog for toolchain ${version}`);
        dispatch(showFirstInstallDialog());
    }
    setHasInstalledAnNcs();

    try {
        await dispatch(ensureCleanTargetDir(toolchainDir));
        await dispatch(installToolchain(version, toolchain, toolchainDir));
        await dispatch(cloneNcs(version, toolchainDir, justUpdate));
    } catch (error) {
        dispatch(showErrorDialog(`${error.message || error}`));
        sendErrorReport(error.message || error);
    }
};

export const removeDir = srcDir => async dispatch => {
    let renameOfDirSuccessful = false;
    try {
        const toBeDeletedDir = path.resolve(srcDir, '..', 'toBeDeleted');
        await fse.move(srcDir, toBeDeletedDir, { overwrite: true });
        renameOfDirSuccessful = true;
        await fse.remove(toBeDeletedDir);
    } catch (error) {
        const [, , message] = `${error}`.split(/[:,] /);
        const errorMsg =
            `Failed to remove ${srcDir}, ${message}. ` +
            'Please close any application or window that might keep this ' +
            'environment locked, then try to remove it again.';
        dispatch(showErrorDialog(errorMsg));
        sendErrorReport(errorMsg);
    }
    return renameOfDirSuccessful;
};

export const remove = ({ toolchainDir, version }) => async dispatch => {
    logger.info(`Removing ${version} at ${toolchainDir}`);
    sendUsageData(EventAction.REMOVE_TOOLCHAIN, `${version}`);

    dispatch(startRemoving(version));

    if (await dispatch(removeDir(path.dirname(toolchainDir)))) {
        logger.info(`Finished removing ${version} at ${toolchainDir}`);
        dispatch(removeEnvironment(version));
    }

    dispatch(finishRemoving(version));
};

export const installPackage = urlOrFilePath => async dispatch => {
    sendUsageData(EventAction.INSTALL_TOOLCHAIN_FROM_PATH, `${urlOrFilePath}`);
    const match = /ncs-toolchain-(v?.+?)([-_]\d{8}-[^.]+).[zip|dmg|snap]/.exec(
        urlOrFilePath
    );
    if (!match) {
        const errorMsg = 'Filename is not recognized as a toolchain package.';
        dispatch(showErrorDialog(errorMsg));
        sendErrorReport(errorMsg);
        return;
    }

    try {
        const version = match[1];
        const toolchainDir = path.resolve(installDir(), version, 'toolchain');

        await dispatch(ensureCleanTargetDir(toolchainDir));

        fse.mkdirpSync(toolchainDir);

        dispatch(
            addLocallyExistingEnvironment(version, toolchainDir, false, false)
        );
        dispatch(startInstallToolchain(version));

        const filePath = fse.existsSync(urlOrFilePath)
            ? urlOrFilePath
            : await dispatch(download(version, { uri: urlOrFilePath }));

        await dispatch(unpack(version, filePath, toolchainDir));
        updateConfigFile(toolchainDir);
        dispatch(finishInstallToolchain(version, toolchainDir));
        await dispatch(cloneNcs(version, toolchainDir, false));
    } catch (error) {
        dispatch(showErrorDialog(`${error.message || error}`));
        sendErrorReport(error.message || error);
    }
};
