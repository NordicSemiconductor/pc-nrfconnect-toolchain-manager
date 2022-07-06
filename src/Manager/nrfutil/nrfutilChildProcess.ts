/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec, execSync, spawn, spawnSync } from 'child_process';

import nrfutilToolchainManager from './nrfutilToolchainManager';

interface PartialEnv {
    [key: string]: string;
}

const updateEnv = (envToAdd?: PartialEnv, envKeysToRemove?: string[]) => {
    const { env } = process;

    if (envToAdd)
        Object.keys(envToAdd).forEach(key => {
            env[key] = `${env[key]}:${envToAdd[key]}`;
        });

    envKeysToRemove?.forEach(key => {
        delete env[key];
    });

    return env;
};

export const nrfutilSpawnSync = (
    args: string[],
    envToAdd?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    spawnSync(nrfutilToolchainManager(), args, {
        encoding: 'utf8',
        env: updateEnv(envToAdd, envKeysToRemove),
    });

export const nrfutilSpawn = (
    args: string[],
    envToAdd?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    spawn(nrfutilToolchainManager(), args, {
        env: updateEnv(envToAdd, envKeysToRemove),
    });

export const nrfutilExec = (
    command: string,
    envToAdd?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    exec(command, {
        encoding: 'utf-8',
        env: updateEnv(envToAdd, envKeysToRemove),
    });

export const nrfutilExecSync = (
    command: string,
    envToAdd?: PartialEnv,
    envKeysToRemove?: string[]
) =>
    execSync(command, {
        encoding: 'utf-8',
        env: updateEnv(envToAdd, envKeysToRemove),
    });
