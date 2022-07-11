/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { mkdirSync } from 'fs';
import { logger } from 'pc-nrfconnect-shared';
import treeKill from 'tree-kill';

import { persistedInstallDir as installDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import {
    nrfutilSpawn,
    stripAndPrintNrfutilLogOutput,
} from './nrfutilChildProcess';

const noop = () => {};

const west = (
    westParams: string[],
    version: string,
    signal: AbortSignal,
    onUpdate: (update: string) => void = noop
) =>
    new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
            resolve();
        }

        mkdirSync(sdkPath(version), {
            recursive: true,
        });

        const tcm = nrfutilSpawn(
            [
                'launch',
                '--chdir',
                sdkPath(version),
                '--ncs-version',
                version,
                '--install-dir',
                installDir(),
                '--',
                'west',
                '-v',
                ...westParams,
            ],
            undefined,
            ['ZEPHYR_BASE']
        );

        const abortListener = () => treeKill(tcm.pid);
        signal.addEventListener('abort', abortListener);

        tcm.stderr.on('data', err => logger.debug(err));
        tcm.stdout.on('data', data => {
            logger.debug(data.toString().trimEnd());
            const strippedLog = stripAndPrintNrfutilLogOutput(data.toString());
            if (strippedLog?.length > 0) onUpdate(strippedLog);
        });
        tcm.on('close', code => {
            signal.removeEventListener('abort', abortListener);

            if (code === 0 || signal.aborted) resolve();
            else reject();
        });
    });

export const westInit = (
    version: string,
    signal: AbortSignal,
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
        signal,
        onUpdate
    );

export const westUpdate = (
    version: string,
    signal: AbortSignal,
    onUpdate?: (update: string) => void
) => west(['update'], version, signal, onUpdate);

export const westExport = (
    version: string,
    signal: AbortSignal,
    onUpdate?: (update: string) => void
) => west(['zephyr-export'], version, signal, onUpdate);
