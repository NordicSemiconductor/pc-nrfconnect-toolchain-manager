/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useDispatch } from 'react-redux';
import { exec, ExecException, execSync } from 'child_process';
import { shell } from 'electron';
import { readdirSync } from 'fs';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Environment } from '../../state';
import EventAction from '../../usageDataActions';
import { showConfirmRemoveDialog } from '../managerSlice';
import { showNrfUtilDialogAction } from '../nrfutil/nrfUtilDialogSlice';
import {
    launchGnomeTerminal,
    launchTerminal,
    launchWinBash,
} from '../nrfutil/terminal';
import sdkPath from '../sdkPath';
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
        launchWinBash(environment.version);
    }
};

const openCmd = (environment: Environment) => {
    logger.info('Open command prompt');
    usageData.sendUsageData(
        EventAction.OPEN_CMD,
        `${process.platform}; ${process.arch}`
    );

    if (environment.type === 'legacy') {
        const directory = getToolchainDir(environment);
        exec(
            `start cmd /k "${path.resolve(directory, 'git-cmd.cmd')}"`,
            execCallback
        );
    } else {
        launchTerminal(environment.version);
    }
};

const launchLegacyTerminal = {
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
};

const openDirectory = (directory: string) => {
    logger.info(`Open directory ${directory}`);
    usageData.sendUsageData(
        EventAction.OPEN_DIR,
        `${process.platform}; ${process.arch}; ${directory}`
    );
    shell.openPath(directory);
};

const hasGnomeTerminal = () => {
    try {
        execSync('command -v gnome-terminal');
        return true;
    } catch (error) {
        return false;
    }
};

type EnvironmentMenuProps = { environment: Environment };
const EnvironmentMenu = ({ environment }: EnvironmentMenuProps) => {
    const dispatch = useDispatch();
    const toolchainDir = getToolchainDir(environment);
    const isLegacyEnv = environment.type === 'legacy';
    const sdkDir = () =>
        isLegacyEnv ? path.dirname(toolchainDir) : sdkPath(environment.version);
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
                    <Dropdown.Item onClick={() => openCmd(environment)}>
                        Open command prompt
                    </Dropdown.Item>
                </>
            )}
            {process.platform !== 'win32' && (
                <Dropdown.Item
                    onClick={() => {
                        if (isLegacyEnv) {
                            // @ts-expect-error We don't support all platforms
                            launchLegacyTerminal[platform](
                                toolchainDir,
                                version
                            );
                        } else if (process.platform === 'darwin') {
                            launchTerminal(environment.version);
                        } else if (hasGnomeTerminal()) {
                            launchGnomeTerminal(environment.version);
                        } else
                            dispatch(
                                showNrfUtilDialogAction({
                                    title: 'Terminal not supported',
                                    content:
                                        'Toolchain manager currently only supports gnome-terminal on Linux.\n\n' +
                                        'Alternatively you can use the nRF Connect for VS Code extension and then use the terminal within VS code.\n',
                                })
                            );
                    }}
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
