/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useDispatch } from 'react-redux';
import { require as remoteRequire } from '@electron/remote';
import { exec, ExecException, execSync } from 'child_process';
import { shell } from 'electron';
import { readdirSync } from 'fs';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Environment } from '../../state';
import EventAction from '../../usageDataActions';
import { showConfirmRemoveDialog } from '../managerSlice';
import { launchBash, sdkPath } from '../nrfUtilToolchainManager';
import { cloneNcs } from './effects/cloneNcs';
import { install } from './effects/installEnvironment';
import {
    isInstalled,
    toolchainDir as getToolchainDir,
    version as getVersion,
} from './environmentReducer';

import './style.scss';

const execCallback = (
    error: ExecException | null,
    stdout: string,
    stderr: string
) => {
    logger.info('Terminal has closed');
    if (error) usageData.sendErrorReport(error.message);
    if (stderr) usageData.sendErrorReport(stderr);
    if (stdout) logger.debug(stdout);
};

const { exec: remoteExec } = remoteRequire('child_process');

const openBash = (environment: Environment) => {
    logger.info('Open bash');
    usageData.sendUsageData(
        EventAction.OPEN_BASH,
        `${process.platform}; ${process.arch}`
    );

    if (environment.type === 'legacy') {
        const directory = getToolchainDir(environment);
        exec(`"${path.resolve(directory, 'git-bash.exe')}"`, execCallback);
    } else {
        launchBash();
    }
};

const openCmd = (directory: string) => {
    logger.info('Open command prompt');
    usageData.sendUsageData(
        EventAction.OPEN_CMD,
        `${process.platform}; ${process.arch}`
    );

    exec(
        `start cmd /k "${path.resolve(directory, 'git-cmd.cmd')}"`,
        execCallback
    );
};

const openTerminal = {
    darwin: (toolchainDir: string) => {
        logger.info('Open terminal');
        usageData.sendUsageData(
            EventAction.OPEN_TERMINAL,
            `${process.platform}; ${process.arch}`
        );
        const gitversion = readdirSync(`${toolchainDir}/Cellar/git`).pop();
        const env = [
            `export PATH=${toolchainDir}/bin:/usr/local/bin:$PATH`,
            `export GIT_EXEC_PATH=${toolchainDir}/Cellar/git/${gitversion}/libexec/git-core`,
            'export ZEPHYR_TOOLCHAIN_VARIANT=gnuarmemb',
            `export GNUARMEMB_TOOLCHAIN_PATH=${toolchainDir}`,
        ];
        exec(
            `
osascript <<END
tell application "Terminal"
    do script "cd ${path.dirname(toolchainDir)} ; ${env.join(' ; ')} ; clear"
    activate
end tell
END
            `,
            execCallback
        );
    },
    linux: (toolchainDir: string) => {
        logger.info('Open terminal');
        usageData.sendUsageData(
            EventAction.OPEN_TERMINAL,
            `${process.platform}; ${process.arch}`
        );
        const terminalApp = execSync(
            'gsettings get org.gnome.desktop.default-applications.terminal exec'
        )
            .toString()
            .trim()
            .replace(/'/g, '');

        const e = [
            `PATH=${toolchainDir}/bin:${toolchainDir}/usr/bin:${toolchainDir}/segger_embedded_studio/bin:${process.env.PATH}`,
            `PYTHONHOME=${toolchainDir}/lib/python3.8`,
            `PYTHONPATH=${toolchainDir}/usr/lib/python3.8:${toolchainDir}/lib/python3.8/site-packages:${toolchainDir}/usr/lib/python3/dist-packages:${toolchainDir}/usr/lib/python3.8/lib-dynload`,
            `GIT_EXEC_PATH=${toolchainDir}/usr/lib/git-core`,
            `LD_LIBRARY_PATH=/var/lib/snapd/lib/gl:/var/lib/snapd/lib/gl32:/var/lib/snapd/void:${toolchainDir}/lib/python3.8/site-packages/.libs_cffi_backend:${toolchainDir}/lib/python3.8/site-packages/Pillow.libs:${toolchainDir}/lib/x86_64-linux-gnu:${toolchainDir}/segger_embedded_studio/bin:${toolchainDir}/usr/lib/x86_64-linux-gnu:${toolchainDir}/lib:${toolchainDir}/usr/lib:${toolchainDir}/lib/x86_64-linux-gnu:${toolchainDir}/usr/lib/x86_64-linux-gnu`,
        ].join(' ');

        remoteExec(
            `${terminalApp} -- bash -c "${e} bash"`,
            { cwd: path.dirname(toolchainDir) },
            execCallback
        );
    },
};

const openDirectory = (directory: string) => {
    logger.info(`Open directory ${directory}`);
    usageData.sendUsageData(
        EventAction.OPEN_DIR,
        `${process.platform}; ${process.arch}; ${directory}`
    );
    shell.openPath(directory);
};

type EnvironmentMenuProps = { environment: Environment };
const EnvironmentMenu = ({ environment }: EnvironmentMenuProps) => {
    const dispatch = useDispatch();
    const toolchainDir = getToolchainDir(environment);
    const sdkDir = () =>
        environment.type === 'legacy'
            ? path.dirname(toolchainDir)
            : sdkPath(environment.version);
    const version = getVersion(environment);
    const { platform } = process;

    return (
        <DropdownButton
            id={`environment-${environment.version}`}
            className="ml-2"
            variant="secondary"
            title=""
            alignRight
            disabled={!isInstalled(environment)}
        >
            {process.platform === 'win32' && (
                <>
                    <Dropdown.Item onClick={() => openBash(environment)}>
                        Open bash
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => openCmd(toolchainDir)}>
                        Open command prompt
                    </Dropdown.Item>
                </>
            )}
            {process.platform !== 'win32' && (
                <Dropdown.Item
                    onClick={() =>
                        // @ts-expect-error We don't support all platforms
                        openTerminal[platform](toolchainDir, version)
                    }
                >
                    Open Terminal
                </Dropdown.Item>
            )}
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => openDirectory(sdkDir())}>
                Open SDK directory
            </Dropdown.Item>
            <Dropdown.Item onClick={() => openDirectory(toolchainDir)}>
                Open toolchain directory
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
                onClick={() => dispatch(cloneNcs(version, toolchainDir, true))}
            >
                Update SDK
            </Dropdown.Item>
            <Dropdown.Item onClick={() => dispatch(install(environment, true))}>
                Update toolchain
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
                onClick={() => dispatch(showConfirmRemoveDialog(version))}
            >
                Remove
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default EnvironmentMenu;
