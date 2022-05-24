/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { getAppDir, logger } from 'pc-nrfconnect-shared';

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
                getAppDir(),
                'resources',
                'nrfutil-toolchain-manager.exe'
            );
        default:
            logger.error(`Unsupported platform detected: ${process.platform}`);
            throw new Error();
    }
})();

export const listSdks = (): SDK[] => {
    const tcm = spawnSync(executablePath, ['--json', 'list'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data.sdks as SDK[];
};

export const searchSdks = (): SearchResult => {
    const tcm = spawnSync(executablePath, ['--json', 'search'], {
        encoding: 'utf8',
    });
    const { data } = JSON.parse(tcm.stdout);
    return data as SearchResult;
};

export const logNrfUtilTMVersion = (): void => {
    const tcm = spawnSync(executablePath, ['--json', '--version'], {
        encoding: 'utf8',
    });

    const version = JSON.parse(tcm.stdout).data as VersionInformation;
    logger.info(
        `${version.name} ${version.version} (${version.commit_hash} ${version.commit_date})`
    );
};

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
        toolchains: {
            name: string;
            sha512: string;
            version: string;
        }[];
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
