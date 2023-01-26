/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec, execSync, spawn, spawnSync } from 'child_process';
import path from 'path';
import { getAppFile, isLoggingVerbose, logger } from 'pc-nrfconnect-shared';

import handleChunk from './handleChunk';
import nrfutilToolchainManager from './nrfutilToolchainManager';

interface PartialEnv {
    [key: string]: string;
}

const vcRuntimeDllPath = () =>
    getAppFile(
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
    const env = { ...process.env };

    Object.entries(envToSet).forEach(([key, entry]) => {
        env[key] = entry;
    });

    envKeysToRemove.forEach(key => {
        delete env[key];
    });

    if (process.platform === 'win32') {
        // For some reason only `env.Path` exists after spreading process.env above,
        // despite process.env including `path`, `Path` and `PATH`.
        // After spawning a process however, windows only recognizes `PATH` in the env
        // We extract process.env.PATH here to make it explicit
        const PATH = process.env.PATH;

        env.PATH = `${vcRuntimeDllPath()}${path.delimiter}${PATH}`;
    }

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

export const nrfutilSpawnSync = <T>(
    args: string[],
    envToSet?: PartialEnv,
    envKeysToRemove?: string[]
) => {
    const tcm = spawnSync(nrfutilToolchainManager(), updateArgs(args), {
        encoding: 'utf8',
        env: updateEnv(envToSet, envKeysToRemove),
    });

    return JSON.parse(stripAndPrintNrfutilLogOutput(tcm.stdout)).data as T;
};

export const nrfutilSpawn = (
    args: string[],
    onData: (line: string) => void,
    envToSet?: PartialEnv,
    envKeysToRemove?: string[]
) => {
    const childProcess = spawn(nrfutilToolchainManager(), updateArgs(args), {
        env: updateEnv(envToSet, envKeysToRemove),
    });

    childProcess.stdout.on(
        'data',
        handleChunk(onData, stripAndPrintNrfutilLogOutput)
    );

    return childProcess;
};

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
