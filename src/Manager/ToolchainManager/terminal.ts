/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import sdkPath from '../sdkPath';
import { getToolChainManagerSandbox } from './common';

export const launchTerminalGeneric = async (
    chdir: string,
    ncsVersion: string,
    installDir?: string,
    args?: string[],
    launchWith?: string
) => {
    const box = await getToolChainManagerSandbox();
    const argsTemp: string[] = ['--chdir', chdir, '--ncs-version', ncsVersion];

    if (installDir) {
        argsTemp.push('--install-dir', installDir);
    }

    const zephyrPath = await sdkPath(ncsVersion, 'zephyr');

    if (launchWith) {
        box.execCommand(
            launchWith,
            [
                '--',
                box.getNrfutilExePath(),
                box.module,
                'launch',
                ...argsTemp,
                ...(args ?? []),
            ],
            () => undefined,
            () => {},
            undefined,
            env => ({
                ...env,
                ZEPHYR_BASE: zephyrPath,
            })
        );
    } else {
        box.execCommand(
            box.getNrfutilExePath(),
            [box.module, 'launch', ...argsTemp, ...(args ?? [])],
            () => undefined,
            () => {},
            undefined,
            env => ({
                ...env,
                ZEPHYR_BASE: zephyrPath,
            })
        );
    }
};

export const launchWinBash = async (
    ncsVersion: string,
    installDir?: string
) => {
    launchTerminalGeneric(await sdkPath(ncsVersion), ncsVersion, installDir, [
        'cmd.exe',
        '/k',
        'start',
        'bash.exe',
    ]);
};

export const launchTerminal = async (
    ncsVersion: string,
    installDir?: string
) => {
    launchTerminalGeneric(await sdkPath(ncsVersion), ncsVersion, installDir, [
        '--terminal',
    ]);
};

export const launchGnomeTerminal = async (
    ncsVersion: string,
    installDir?: string
) => {
    launchTerminalGeneric(
        await sdkPath(ncsVersion),
        ncsVersion,
        installDir,
        ['--shell'],
        'gnome-terminal'
    );
};
