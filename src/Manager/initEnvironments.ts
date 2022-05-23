/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { net } from '@electron/remote';
import { execSync } from 'child_process';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { getAppDir, logger, usageData } from 'pc-nrfconnect-shared';
import { gt } from 'semver';

import {
    persistedInstallDir as installDir,
    toolchainIndexUrl,
} from '../persistentStore';
import { Dispatch, Environment } from '../state';
import EventAction from '../usageDataActions';
import { isWestPresent } from './Environment/effects/helpers';
import {
    addEnvironment,
    addLocallyExistingEnvironment,
    clearEnvironments,
} from './managerSlice';

const EXE_PATH_WIN = path.resolve(getAppDir(), 'resources', 'nrfutil.exe');
const EXE_PATH_MAC = path.resolve(getAppDir(), 'resources', 'nrfutil.exe');
const EXE_PATH_LINUX = path.resolve(getAppDir(), 'resources', 'nrfutil.exe');

let exePath: string;
switch (process.platform) {
    case 'win32':
        exePath = EXE_PATH_WIN;
        break;
    case 'darwin':
        exePath = EXE_PATH_MAC;
        break;
    case 'linux':
        exePath = EXE_PATH_LINUX;
        break;
    default:
        logger.error(`Unsupported platform detected: ${process.platform}`);
}

const detectLocallyExistingEnvironments = (dispatch: Dispatch) => {
    try {
        fs.readdirSync(installDir(), { withFileTypes: true })
            .filter(dirEnt => dirEnt.isDirectory())
            .map(({ name }) => ({
                version: name,
                toolchainDir: path.resolve(installDir(), name, 'toolchain'),
            }))
            .filter(({ toolchainDir }) =>
                fs.existsSync(path.resolve(toolchainDir, 'ncsmgr/manifest.env'))
            )
            .forEach(({ version, toolchainDir }) => {
                const westPresent = isWestPresent(toolchainDir);
                logger.info(
                    `Locally exsisting environment found at ${toolchainDir}`
                );
                logger.info(`With version: ${version}`);
                logger.info(`With west found: ${westPresent ? 'yes' : 'no'}`);
                usageData.sendUsageData(
                    EventAction.REPORT_LOCAL_ENVS,
                    `${version}; ${
                        westPresent ? 'west found' : 'west not found'
                    }`
                );
                dispatch(
                    addLocallyExistingEnvironment({
                        version,
                        toolchainDir,
                        isWestPresent: westPresent,
                        isInstalled: true,
                    })
                );
            });
    } catch (e) {
        usageData.sendErrorReport(
            `Fail to detect locally existing environments with error: ${e}`
        );
    }
};

const downloadIndexByNrfUtil = (dispatch: Dispatch) => {
    try {
        let result = execSync(`${exePath} toolchain-manager --json list`, {
            encoding: 'utf8',
        });
        let resultJson = JSON.parse(result).data.sdks;
        const installedEnvironments = resultJson.filter(
            (environment: Environment) => gt(environment.version, 'v1.9.99')
        );
        result = execSync(`${exePath} toolchain-manager --json search`, {
            encoding: 'utf8',
        });

        resultJson = JSON.parse(result).data.sdks;
        resultJson
            .filter((environment: Environment) =>
                gt(environment.version, 'v1.9.99')
            )
            .map((environment: Environment) => ({
                ...environment,
                isInstalled: !!installedEnvironments.find(
                    (e: Environment) => e.version === environment.version
                ),
            }))
            .forEach((environment: Environment) => {
                dispatch(addEnvironment(environment));
                logger.info(
                    `Toolchain ${environment.version} has been added to the list`
                );
            });
    } catch (e) {
        logger.error(`Failed to download toolchain index file`);
    }
};

const downloadIndex = (dispatch: Dispatch) => {
    const request = net.request({ url: toolchainIndexUrl() });
    request.setHeader('pragma', 'no-cache');
    request.on('response', response => {
        let result = '';
        response.on('end', () => {
            if (response.statusCode !== 200) {
                usageData.sendErrorReport(
                    `Unable to download ${toolchainIndexUrl()}. Got status code ${
                        response.statusCode
                    }`
                );
                return;
            }

            try {
                logger.debug(
                    `Index json has been downloaded with result: ${result}`
                );
                JSON.parse(result).forEach((environment: Environment) => {
                    dispatch(addEnvironment(environment));
                    logger.info(
                        `Toolchain ${environment.version} has been added to the list`
                    );
                });
            } catch (e) {
                usageData.sendErrorReport(
                    `Fail to parse index json file with error: ${e}`
                );
            }
        });
        response.on('data', buf => {
            logger.debug(
                `Downloading index json with buffer length: ${buf.length}`
            );
            result += `${buf}`;
        });
    });
    request.on('error', e => {
        usageData.sendErrorReport(
            `Fail to detect locally existing environments with error: ${e}`
        );
    });
    request.end();
};

const checkNrfUtil = () => {
    try {
        const result = execSync(`${exePath} -v --json`, { encoding: 'utf8' });
        const resultJson = JSON.parse(result);
        logger.info(`Using nRF Util version: ${resultJson.data.version}`);
        checkToolchainManagerCli();
    } catch (e) {
        logger.error(`Failed to check nRF Util version: ${e}`);
    }
};

const checkToolchainManagerCli = () => {
    try {
        let result = execSync(`${exePath} list`, { encoding: 'utf8' });
        const isToolchainManagerInstalled =
            result.includes('toolchain-manager');
        if (!isToolchainManagerInstalled) {
            installToolchainManagerCli();
        }

        result = execSync(`${exePath} toolchain-manager -v --json`, {
            encoding: 'utf8',
        });
        const resultJson = JSON.parse(result);
        logger.info(
            `Using Toolchain Manager CLI version: ${resultJson.data.version}`
        );
    } catch (e) {
        logger.error(`Failed to check Toolchain Manager CLI version: ${e}`);
    }
};

const installToolchainManagerCli = () => {
    try {
        execSync(`${exePath} install toolchain-manager`, {
            encoding: 'utf8',
        });
        execSync(`${exePath} list`, { encoding: 'utf8' });
    } catch (e) {
        logger.error(`Failed to install Toolchain Manager CLI version: ${e}`);
    }
};

export default (dispatch: Dispatch) => {
    logger.info('Initializing environments...');
    checkNrfUtil();
    const dir = path.dirname(installDir());
    if (
        process.platform === 'darwin' &&
        // eslint-disable-next-line no-bitwise
        (!fs.existsSync(dir) || (fs.statSync(dir).mode & 0o3775) !== 0o3775)
    ) {
        const prompt = `Base directory ${dir} needs to be created, to do this please...`;
        const script = `install -d -g staff -m 3775 ${dir}`;
        logger.info(prompt);
        execSync(
            `osascript -e "do shell script \\"${script} \\" with prompt \\"${prompt} \\" with administrator privileges"`
        );
    }
    fse.mkdirpSync(installDir());
    dispatch(clearEnvironments());
    detectLocallyExistingEnvironments(dispatch);
    downloadIndex(dispatch);
    downloadIndexByNrfUtil(dispatch);
};
