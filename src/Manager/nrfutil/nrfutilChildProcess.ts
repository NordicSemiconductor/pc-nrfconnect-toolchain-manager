/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec, execSync, spawn, spawnSync } from 'child_process';
import path from 'path';
import { getAppFile, isLoggingVerbose, logger } from 'pc-nrfconnect-shared';

import nrfutilToolchainManager from './nrfutilToolchainManager';

interface PartialEnv {
    [key: string]: string;
}

const vcRuntimeDllPath = getAppFile(
    path.join(
        'resources',
        'nrfutil-toolchain-manager',
        'win32',
        'vcruntime140.dll'
    )
);

const updateEnv = (
    envToSet: PartialEnv = {},
    envKeysToRemove: string[] = []
) => {
    const { env } = process;

    Object.entries(envToSet).forEach(([key, entry]) => {
        env[key] = entry;
    });

    envKeysToRemove.forEach(key => {
        delete env[key];
    });

    if (process.platform === 'win32')
        env.PATH = `${vcRuntimeDllPath}${path.delimiter}${env.PATH}`;

    return env;
};

const updateArgs = (args: string[]) => {
    if (isLoggingVerbose())
        return [
            '--json',
            '--log-output=stdout',
            '--log-level',
            'trace',
            ...args,
        ];
    return ['--json', ...args];
};

export const stripAndPrintNrfutilLogOutput = (output: string) =>
    output
        .split('\n')
        .filter(Boolean)
        .filter(line => {
            try {
                const outputObject = JSON.parse(line);

                if (outputObject.type === 'log') {
                    switch (outputObject.data.level.toString()) {
                        case 'INFO':
                            logger.info(
                                `[nrfutil] ${outputObject.data.message}`
                            );
                            break;
                        case 'WARN':
                            logger.warn(
                                `[nrfutil] ${outputObject.data.message}`
                            );
                            break;
                        case 'ERROR':
                            logger.error(
                                `[nrfutil] ${outputObject.data.message}`
                            );
                            break;
                        case 'TRACE':
                        case 'DEBUG':
                        default:
                            logger.debug(
                                `[nrfutil] ${outputObject.data.message}`
                            );
                    }
                    return false;
                }
                return true;
            } catch (e) {
                return true;
            }
        })
        .join('\n');

export const nrfutilSpawnSync = (
    args: string[],
    envToSet?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    spawnSync(nrfutilToolchainManager(), updateArgs(args), {
        encoding: 'utf8',
        env: updateEnv(envToSet, envKeysToRemove),
    });

export const nrfutilSpawn = (
    args: string[],
    envToSet?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    spawn(nrfutilToolchainManager(), updateArgs(args), {
        env: updateEnv(envToSet, envKeysToRemove),
    });

export const nrfutilExec = (
    command: string,
    envToSet?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    exec(command, {
        encoding: 'utf-8',
        env: updateEnv(envToSet, envKeysToRemove),
    });

export const nrfutilExecSync = (
    command: string,
    envToSet?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    execSync(command, {
        encoding: 'utf-8',
        env: updateEnv(envToSet, envKeysToRemove),
    });
