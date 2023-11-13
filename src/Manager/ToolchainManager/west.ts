/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getNrfutilLogger } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/nrfutilLogger';
import { mkdirSync } from 'fs';

import { persistedInstallDir } from '../../persistentStore';
import sdkPath from '../sdkPath';
import { getToolChainManagerSandbox } from './common';

const parser = (onData: (line: string) => void, chunk: Buffer) => {
    let buffer = chunk.toString('utf8');

    while (buffer.includes('\n')) {
        const message = buffer.split('\n')[0];
        buffer = buffer.substring(message.length + 1);

        if (message.length > 0) {
            onData(message);
        }
    }

    return Buffer.from(buffer);
};

const west = async (
    ncsVersion: string,
    westParams: string[],
    installDir?: string,
    controller?: AbortController,
    onUpdate: (update: string) => void = () => {}
) => {
    if (controller?.signal.aborted) {
        return;
    }

    const box = await getToolChainManagerSandbox();

    const chdir = await sdkPath(ncsVersion);

    mkdirSync(chdir, {
        recursive: true,
    });

    const args: string[] = ['--chdir', chdir, '--ncs-version', ncsVersion];

    if (installDir) {
        args.push('--install-dir');
        args.push(installDir);
    }

    const onData = (line: string): void => {
        getNrfutilLogger()?.debug(line.trimEnd());
        onUpdate(line);
    };

    let stdErr = '';
    try {
        await box.spawnCommand(
            box.getNrfutilExePath(),
            [box.module, 'launch', ...args, '--', 'west', '-v', ...westParams],
            data => parser(onData, data),
            stdError => {
                stdErr += stdError.toString();
            }, // for some reason, west logs to stderr
            controller,
            env => {
                const newEnv = { ...env };
                delete newEnv.ZEPHYR_BASE;
                return newEnv;
            }
        );
    } catch (error) {
        if (!controller?.signal.aborted) throw new Error(stdErr);
    }
};

export const westInit = (
    version: string,
    controller: AbortController,
    onUpdate?: (update: string) => void
) =>
    west(
        version,
        [
            'init',
            '-m',
            'https://github.com/nrfconnect/sdk-nrf',
            '--mr',
            version,
        ],
        persistedInstallDir(),
        controller,
        onUpdate
    );

export const westUpdate = (
    version: string,
    controller: AbortController,
    onUpdate?: (update: string) => void
) => west(version, ['update'], persistedInstallDir(), controller, onUpdate);

export const westExport = (
    version: string,
    controller: AbortController,
    onUpdate?: (update: string) => void
) =>
    west(
        version,
        ['zephyr-export'],
        persistedInstallDir(),
        controller,
        onUpdate
    );
