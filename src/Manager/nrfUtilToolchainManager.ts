/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { getAppFile, logger } from 'pc-nrfconnect-shared';

import { TaskEvent, Toolchain } from '../state';

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

export const getNrfUtilConfig = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'config'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);

    return data as Config;
};

export const listSdks = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'list'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as SDK[];
};

export const searchSdks = () => {
    const tcm = spawnSync(nrfutilToolchainManager(), ['--json', 'search'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data as SearchResult;
};

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

export const installSdk = (
    version: string,
    onUpdate: (update: TaskEvent) => void
) =>
    new Promise(resolve => {
        const tcm = spawn(nrfutilToolchainManager(), [
            '--json',
            'install',
            '--toolchain-index',
            'http://localhost:8080/index-win10.json',
            version,
        ]);

        tcm.stdout.on('data', handleChunk(onUpdate));

        tcm.on('close', resolve);
    });

interface SDK {
    path: string;
    toolchain: {
        path: string;
    };
    version: string;
}

interface SearchResult {
    index_url: string;
    sdks: {
        toolchains: Toolchain[];
        version: string;
    }[];
}

interface VersionInformation {
    build_timestamp: string;
    commit_date: string;
    commit_hash: string;
    dependencies: null;
    host: string;
    name: string;
    version: string;
}

interface Config {
    current_sdk_install: null;
    install_dir: string;
    toolchain_index_url_override: null;
}
