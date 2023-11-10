/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import sdkPath from '../sdkPath';
import { getToolChainManagerSandbox } from './common';

const launchTerminalGeneric = async (
    chdir: string,
    ncsVersion: string,
    installDir: string,
    args?: string[],
    launchWith?: string
) => {
    const box = await getToolChainManagerSandbox();
    const argsTemp: string[] = [];

    if (chdir) {
        argsTemp.push('--chdir');
        argsTemp.push(chdir);
    }

    if (ncsVersion) {
        argsTemp.push('--ncs-version');
        argsTemp.push(ncsVersion);
    }

    argsTemp.push('--install-dir');
    argsTemp.push(installDir);

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
            env => ({ ...env, ZEPHYR_BASE: sdkPath(ncsVersion, 'zephyr') })
        );
    } else {
        box.execCommand(
            box.getNrfutilExePath(),
            [box.module, 'launch', ...argsTemp, ...(args ?? [])],
            () => undefined,
            () => {},
            undefined,
            env => ({ ...env, ZEPHYR_BASE: sdkPath(ncsVersion, 'zephyr') })
        );
    }
};

export const launchWinBash = (ncsVersion: string, installDir: string) => {
    launchTerminalGeneric(sdkPath(ncsVersion), ncsVersion, installDir, [
        'cmd.exe',
        '/k',
        'start',
        'bash.exe',
    ]);
};

export const launchTerminal = (ncsVersion: string, installDir: string) => {
    launchTerminalGeneric(sdkPath(ncsVersion), ncsVersion, installDir, [
        '--terminal',
    ]);
};

export const launchGnomeTerminal = (ncsVersion: string, installDir: string) => {
    launchTerminalGeneric(
        sdkPath(ncsVersion),
        ncsVersion,
        installDir,
        ['--shell'],
        'gnome-terminal'
    );
};
