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
    abortSignal: AbortSignal,
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
            '--install-dir',
            installDir(),
            '--',
            'west',
            ...westParams,
        ]);

        tcm.stdout.on('data', onUpdate);
        tcm.stdout.on('error', onError);
        tcm.stderr.on('data', onErrorData);

        const close = (code: number) => {
            abortSignal?.removeEventListener('abort', killer);
            code === 0 ? resolve() : reject();
        };

        const killer = () => {
            tcm.off('close', close);
            tcm.kill();
            resolve();
        };

        abortSignal?.addEventListener('abort', killer);
        tcm.on('close', close);
    });

export const westInit = (
    version: string,
    abortSignal: AbortSignal,
    onUpdate?: (update: string) => void,
    onError?: (error: string) => void,
    onErrorData?: (error: string) => void
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
        abortSignal,
        onUpdate,
        onError,
        onErrorData
    );

export const westUpdate = (
    version: string,
    abortSignal: AbortSignal,
    onUpdate?: (update: string) => void,
    onError?: (error: string) => void,
    onErrorData?: (error: string) => void
) => west(['update'], version, abortSignal, onUpdate, onError, onErrorData);
