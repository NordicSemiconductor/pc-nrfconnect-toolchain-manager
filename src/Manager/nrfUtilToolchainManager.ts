/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { exec, spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getAppFile, logger } from 'pc-nrfconnect-shared';

import type { TaskEvent, Toolchain } from '../state';

const nrfutilToolchainManager = () => {
    const executable = getAppFile(
        path.join(
            'resources',
            'nrfutil-toolchain-manager',
            process.platform,
            'nrfutil-toolchain-manager.exe'
        )
    );

    if (executable == null || !existsSync(executable)) {
        const message = `No executable '${executable}' found.`;

        logger.error(message);
        throw new Error(message);
    }

    return executable;
};

interface Config {
    current_toolchain: null | {
        data: string;
        type: string;
    };
    install_dir: string;
    toolchain_index_url_override: null | string;
}

export const getNrfUtilConfig = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'config'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);

    return data as Config;
};

interface InstalledToolchain {
    path: string;
    ncs_version: string;
}

export const listToolchains = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'list'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.toolchains as InstalledToolchain[];
};

interface ToolchainSearch {
    toolchains: Toolchain[];
    version: string;
}

export const searchToolchains = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'search'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as ToolchainSearch[];
};

interface VersionInformation {
    build_timestamp: string;
    commit_date: string;
    commit_hash: string;
    dependencies: null;
    host: string;
    name: string;
    version: string;
}

export const logNrfUtilTMVersion = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', '--version'], {
        encoding: 'utf8',
    });

    const version = JSON.parse(tcm.stdout).data as VersionInformation;

    logger.info(
        `${version.name} ${version.version} (${version.commit_hash} ${version.commit_date})`
    );
};

export const handleChunk = (onUpdate: (update: TaskEvent) => void) => {
    let buffer = '';
    return (chunk: Buffer) => {
        buffer += chunk.toString('utf8');

        while (buffer.includes('\n')) {
            const message = buffer.split('\n')[0];
            buffer = buffer.substring(message.length + 1);
            onUpdate(JSON.parse(message));
        }
    };
};

export const installToolchain = (
    version: string,
    onUpdate: (update: TaskEvent) => void
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'install',
            version,
        ]);

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', code => (code === 0 ? resolve() : reject()));
    });

const noop = () => {};
export const removeToolchain = (
    version: string,
    onUpdate: (update: TaskEvent) => void = noop
) =>
    new Promise(resolve => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'remove',
            version,
        ]);

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', resolve);
    });

export const sdkPath = (version: string) =>
    path.resolve(getNrfUtilConfig().install_dir, version);

export const westInit = (version: string) =>
    new Promise(resolve => {
        mkdirSync(sdkPath(version), {
            recursive: true,
        });

        const tcm = spawn(nrfutilToolchainManager(), [
            'launch',
            '--chdir',
            sdkPath(version),
            '--',
            'west',
            'init',
            '-m',
            'https://github.com/nrfconnect/sdk-nrf',
            '--mr',
            version,
        ]);

        tcm.on('close', resolve);
    });

export const westUpdate = (
    version: string,
    onUpdate: (update: string) => void,
    onError: (error: string) => void,
    onErrorData: (error: string) => void
) =>
    new Promise<void>((resolve, reject) => {
        const tcm = spawn(nrfutilToolchainManager(), [
            'launch',
            '--chdir',
            sdkPath(version),
            '--',
            'west',
            'update',
        ]);

        tcm.stdout.on('data', onUpdate);
        tcm.stdout.on('error', onError);
        tcm.stderr.on('data', onErrorData);
        tcm.on('close', code => (code === 0 ? resolve() : reject()));
    });

export const launchWinBash = () => {
    exec(`${nrfutilToolchainManager()}  launch cmd.exe /k start bash.exe`);
};

export const launchTerminal = () => {
    exec(`${nrfutilToolchainManager()}  launch --terminal`);
};
