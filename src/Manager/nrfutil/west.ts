/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { spawn } from 'child_process';
import { mkdirSync } from 'fs';

import sdkPath from '../sdkPath';
import nrfutilToolchainManager from './nrfutilToolchainManager';

const noop = () => {};

const west = (
    westParams: string[],
    version: string,
    onUpdate: (update: string) => void = noop,
    onError: (error: string) => void = noop,
    onErrorData: (error: string) => void = noop
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
            '--',
            'west',
            ...westParams,
        ]);

        tcm.stdout.on('data', onUpdate);
        tcm.stdout.on('error', onError);
        tcm.stderr.on('data', onErrorData);
        tcm.on('close', code => (code === 0 ? resolve() : reject()));
    });

export const westInit = (
    version: string,
    onUpdate: (update: string) => void = noop,
    onError: (error: string) => void = noop,
    onErrorData: (error: string) => void = noop
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
        onUpdate,
        onError,
        onErrorData
    );

export const westUpdate = (
    version: string,
    onUpdate: (update: string) => void,
    onError: (error: string) => void,
    onErrorData: (error: string) => void
) => west(['update'], version, onUpdate, onError, onErrorData);
