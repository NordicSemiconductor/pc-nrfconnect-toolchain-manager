/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';
import { mkdirSync } from 'fs';

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import nrfutilToolchainManager from './nrfutilToolchainManager';

const noop = () => {};

const west = (
    westParams: string[],
    version: string,
    onUpdate: (update: string) => void = noop
) =>
    new Promise<void>((resolve, reject) => {
        mkdirSync(sdkPath(version), {
            recursive: true,
        });

        const tcm = spawn(nrfutilToolchainManager(), [
            'launch',
            '--chdir',
            sdkPath(version),
            '--ncs-version',
            version,
            '--install-dir',
            installDir(),
            '--',
            'west',
            ...westParams,
        ]);

        tcm.stdout.on('data', onUpdate);
        tcm.on('close', code => (code === 0 ? resolve() : reject()));
    });

export const westInit = (
    version: string,
    onUpdate?: (update: string) => void
) =>
    west(
        [
            'init',
            '-m',
            'https://github.com/nrfconnect/sdk-nrf',
            '--mr',
            version,
        ],
        version,
        onUpdate
    );

export const westUpdate = (
    version: string,
    onUpdate?: (update: string) => void
) => west(['update'], version, onUpdate);

export const westExport = (
    version: string,
    onUpdate?: (update: string) => void
) => west(['zephyr-export'], version, onUpdate);
