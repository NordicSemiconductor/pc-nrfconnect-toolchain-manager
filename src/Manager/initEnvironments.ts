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
import { logger, usageData } from 'pc-nrfconnect-shared';

import {
    persistedInstallDir as installDir,
    toolchainIndexUrl,
} from '../persistentStore';
import { Dispatch, Environment } from '../state';
import EventAction from '../usageDataActions';
import { isWestPresent } from './Environment/effects/helpers';
import { isLegacyEnvironment } from './Environment/environmentReducer';
import { addEnvironment, clearEnvironments } from './managerSlice';
import listToolchains from './nrfutil/list';
import logNrfutilVersion from './nrfutil/logVersion';
import searchToolchains from './nrfutil/search';

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
                const westPresent = isWestPresent(version, toolchainDir);
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
                    addEnvironment({
                        type: 'legacy',
                        version,
                        toolchainDir,
                        isWestPresent: westPresent,
                        isInstalled: true,
                        abortController: new AbortController(),
                        toolchains: [],
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
    let installed: Environment[];
    try {
        installed = listToolchains()
            .filter(toolchain => !isLegacyEnvironment(toolchain.ncs_version))
            .map<Environment>(toolchain => {
                const environment: Environment = {
                    version: toolchain.ncs_version,
                    toolchainDir: toolchain.path,
                    toolchains: [],
                    type: 'nrfUtil' as 'nrfUtil' | 'legacy',
                    isInstalled: true,
                    abortController: new AbortController(),
                    isWestPresent: isWestPresent(
                        toolchain.ncs_version,
                        toolchain.path
                    ),
                };
                dispatch(addEnvironment(environment));
                logger.info(
                    `Toolchain ${environment.version} has been added to the list`
                );
                return environment;
            });
    } catch (e) {
        logger.error(`Failed to list local toolchain installations.`);
    }
    try {
        searchToolchains()
            .filter(
                environmentVersion => !isLegacyEnvironment(environmentVersion)
            )
            .map<Environment>(environmentVersion => {
                const installedEnvironment = installed.find(
                    env => env.version === environmentVersion
                );

                if (installedEnvironment) return installedEnvironment;

                return {
                    version: environmentVersion,
                    toolchains: [],
                    toolchainDir: '',
                    type: 'nrfUtil',
                    isInstalled: false,
                    abortController: new AbortController(),
                };
            })
            .forEach(environment => {
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
                JSON.parse(result).forEach(
                    (environment: Omit<Environment, 'type'>) => {
                        dispatch(
                            addEnvironment({
                                ...environment,
                                abortController: new AbortController(),
                                type: 'legacy',
                            })
                        );
                        logger.info(
                            `Toolchain ${environment.version} has been added to the list`
                        );
                    }
                );
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

export default (dispatch: Dispatch): void => {
    logger.info('Initializing environments...');
    logNrfutilVersion(dispatch);
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
    if (process.platform !== 'linux') {
        downloadIndex(dispatch);
    }
    downloadIndexByNrfUtil(dispatch);
};
