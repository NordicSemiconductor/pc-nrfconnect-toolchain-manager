/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { net } from '@electron/remote';
import {
    AppThunk,
    logger,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { execSync } from 'child_process';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';

import {
    persistedInstallDir,
    persistedInstallDirOfToolChainDefault,
    toolchainIndexUrl,
} from '../persistentStore';
import { Environment, RootState } from '../state';
import EventAction from '../usageDataActions';
import { isWestPresent } from './Environment/effects/helpers';
import {
    isLegacyEnvironment,
    isUnsupportedEnvironment,
} from './Environment/environmentReducer';
import { addEnvironment, clearEnvironments } from './managerSlice';
import logNrfutilVersion from './nrfutil/logVersion';
import toolchainManager from './ToolchainManager/toolchainManager';

const detectLocallyExistingEnvironments =
    (): AppThunk<RootState, Promise<void>> => async dispatch => {
        const installDir = await persistedInstallDirOfToolChainDefault();

        try {
            const result = await Promise.all(
                fs
                    .readdirSync(installDir, { withFileTypes: true })
                    .filter(dirEnt => dirEnt.isDirectory())
                    .map(async ({ name }) => ({
                        version: name,
                        toolchainDir: path.resolve(
                            installDir,
                            name,
                            'toolchain'
                        ),
                        westPresent: await isWestPresent(
                            name,
                            path.resolve(installDir, name, 'toolchain')
                        ),
                    }))
            );

            result
                .filter(({ toolchainDir }) =>
                    fs.existsSync(
                        path.resolve(toolchainDir, 'ncsmgr/manifest.env')
                    )
                )
                .forEach(({ version, toolchainDir, westPresent }) => {
                    logger.info(
                        `Locally exsisting environment found at ${toolchainDir}`
                    );
                    logger.info(`With version: ${version}`);
                    logger.info(
                        `With west found: ${westPresent ? 'yes' : 'no'}`
                    );
                    telemetry.sendEvent(EventAction.REPORT_LOCAL_ENVS, {
                        version,
                        westPresent: westPresent
                            ? 'west found'
                            : 'west not found',
                    });
                    dispatch(
                        addEnvironment({
                            type: 'legacy',
                            version,
                            toolchainDir,
                            isWestPresent: westPresent,
                            isInstalled: true,
                            toolchains: [],
                        })
                    );
                });
        } catch (e) {
            telemetry.sendErrorReport(
                `Fail to detect locally existing environments with error: ${e}`
            );
        }
    };

const downloadIndexByNrfUtil =
    (): AppThunk<RootState, Promise<void>> => async dispatch => {
        let installed: Environment[];
        try {
            installed = await Promise.all(
                (
                    await toolchainManager.list(persistedInstallDir())
                ).toolchains
                    .filter(
                        toolchain =>
                            !isLegacyEnvironment(toolchain.ncs_version) &&
                            !isUnsupportedEnvironment(toolchain.ncs_version)
                    )
                    .map<Promise<Environment>>(async toolchain => {
                        const environment: Environment = {
                            version: toolchain.ncs_version,
                            toolchainDir: toolchain.path,
                            toolchains: [],
                            type: 'nrfUtil' as 'nrfUtil' | 'legacy',
                            isInstalled: true,
                            isWestPresent: await isWestPresent(
                                toolchain.ncs_version,
                                toolchain.path
                            ),
                        };
                        dispatch(addEnvironment(environment));
                        logger.info(
                            `Toolchain ${environment.version} has been added to the list`
                        );
                        return environment;
                    })
            );
        } catch (e) {
            logger.error(`Failed to list local toolchain installations.`);
        }
        try {
            (
                await toolchainManager.search(true, persistedInstallDir())
            ).ncs_versions
                .filter(
                    environmentVersion =>
                        !isLegacyEnvironment(environmentVersion) &&
                        !isUnsupportedEnvironment(environmentVersion)
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

const downloadIndex = (): AppThunk<RootState> => dispatch => {
    const request = net.request({ url: toolchainIndexUrl() });
    request.setHeader('pragma', 'no-cache');
    request.on('response', response => {
        let result = '';
        response.on('end', () => {
            if (response.statusCode !== 200) {
                telemetry.sendErrorReport(
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
                                type: 'legacy',
                            })
                        );
                        logger.info(
                            `Toolchain ${environment.version} has been added to the list`
                        );
                    }
                );
            } catch (e) {
                telemetry.sendErrorReport(
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
        telemetry.sendErrorReport(
            `Fail to detect locally existing environments with error: ${e}`
        );
    });
    request.end();
};

export default (): AppThunk<RootState, Promise<void>> => async dispatch => {
    logger.info('Initializing environments...');
    const installDir = await persistedInstallDirOfToolChainDefault();
    await dispatch(logNrfutilVersion());
    const dir = path.dirname(installDir);

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
    fse.mkdirpSync(installDir);
    dispatch(clearEnvironments());
    await dispatch(detectLocallyExistingEnvironments());
    if (process.platform !== 'linux') {
        dispatch(downloadIndex());
    }
    await dispatch(downloadIndexByNrfUtil());
};
