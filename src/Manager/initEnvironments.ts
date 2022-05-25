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
import { gt } from 'semver';

import {
    persistedInstallDir as installDir,
    toolchainIndexUrl,
} from '../persistentStore';
import { Dispatch, LegacyEnvironment } from '../state';
import EventAction from '../usageDataActions';
import { isWestPresent } from './Environment/effects/helpers';
import {
    addEnvironment,
    addLocallyExistingEnvironment,
    clearEnvironments,
} from './managerSlice';
import {
    listSdks,
    logNrfUtilTMVersion,
    searchSdks,
} from './nrfUtilToolchainManager';

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
                        type: 'legacy',
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
        const sdks = listSdks();
        const installedEnvironments = sdks.filter(environment =>
            gt(environment.version, 'v1.9.99')
        );
        const search = searchSdks();
        search.sdks
            .filter(environment => gt(environment.version, 'v1.9.99'))
            .map(environment => ({
                ...environment,
                isInstalled: !!installedEnvironments.find(
                    e => e.version === environment.version
                ),
            }))
            .forEach(environment => {
                dispatch(
                    addEnvironment({
                        type: 'nrfUtil',
                        toolchainDir: '',
                        ...environment,
                    })
                );
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
                    (environment: Omit<LegacyEnvironment, 'type'>) => {
                        dispatch(
                            addEnvironment({ ...environment, type: 'legacy' })
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
    logNrfUtilTMVersion();
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
