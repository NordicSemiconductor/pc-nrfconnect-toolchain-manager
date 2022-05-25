/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn, spawnSync } from 'child_process';
import { chmodSync } from 'fs';
import path from 'path';
import { getAppDir, logger } from 'pc-nrfconnect-shared';

import { Toolchain } from '../state';

const executablePath = (() => {
    switch (process.platform) {
        case 'win32':
            return path.resolve(
                getAppDir(),
                'resources',
                'nrfutil-toolchain-manager.exe'
            );
        case 'darwin':
            return path.resolve(
                getAppDir(),
                'resources',
                'nrfutil-toolchain-manager.exe'
            );
        case 'linux':
            return path.resolve(
                getAppDir() ?? '',
                'resources',
                'nrfutil-toolchain-manager'
            );
        default:
            logger.error(`Unsupported platform detected: ${process.platform}`);
            throw new Error();
    }
})();

if (process.platform === 'linux') {
    chmodSync(executablePath, '0755');
}

export const listSdks = () => {
    const tcm = spawnSync(executablePath, ['--json', 'list'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as SDK[];
};

export const searchSdks = () => {
    const tcm = spawnSync(executablePath, ['--json', 'search'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data as SearchResult;
};

export const logNrfUtilTMVersion = () => {
    const tcm = spawnSync(executablePath, ['--json', '--version'], {
        encoding: 'utf8',
    });

    const version = JSON.parse(tcm.stdout).data as VersionInformation;

    logger.info(
        `${version.name} ${version.version} (${version.commit_hash} ${version.commit_date})`
    );
};

export const handleChunk = (
    onUpdate: (update: TaskBegin | TaskProgress | TaskEnd) => void
) => {
    let buffer = '';
    return (chunk: any) => {
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
    onUpdate: (update: TaskBegin | TaskProgress | TaskEnd) => void
) =>
    new Promise(resolve => {
        const tcm = spawn(executablePath, ['--json', 'install', version]);

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
    // eslint-disable-next-line camelcase
    index_url: string;
    sdks: {
        toolchains: Toolchain[];
        version: string;
    }[];
}

interface VersionInformation {
    // eslint-disable-next-line camelcase
    build_timestamp: string;
    // eslint-disable-next-line camelcase
    commit_date: string;
    // eslint-disable-next-line camelcase
    commit_hash: string;
    dependencies: null;
    host: string;
    name: string;
    version: string;
}

export type Task = TaskBegin | TaskProgress | TaskEnd;

interface TaskDescriptor {
    id: string;
    description: string;
}

interface TaskBegin {
    type: 'task_begin';
    data: {
        task: TaskDescriptor;
    };
}

interface TaskProgress {
    type: 'task_progress';
    data: {
        task: TaskDescriptor;
        progress: {
            progressPercentage: number;
            description: string;
        };
    };
}

interface TaskEnd {
    type: 'task_end';
    data: {
        task: TaskDescriptor;
        message: string;
        result: 'success' | 'failure';
    };
}
