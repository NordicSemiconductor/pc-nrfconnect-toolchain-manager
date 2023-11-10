/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useDispatch, useSelector } from 'react-redux';
import { logger, usageData } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { exec, ExecException, execSync } from 'child_process';
import { shell } from 'electron';
import { readdirSync } from 'fs';
import path from 'path';

import { getAbortController } from '../../globalAbortControler';
import { persistedInstallDir } from '../../persistentStore';
import { Environment } from '../../state';
import EventAction from '../../usageDataActions';
import {
    isAnyToolchainInProgress,
    showConfirmRemoveDialog,
} from '../managerSlice';
import { saveEnvScript } from '../nrfutil/envAsScript';
import { showNrfUtilDialogAction } from '../nrfutil/nrfUtilDialogSlice';
import sdkPath from '../sdkPath';
import toolchainManager from '../ToolchainManager/toolchainManager';
import toolchainPath from '../toolchainPath';
import { cloneNcs } from './effects/cloneNcs';
import { installToolchain } from './effects/installToolchain';
import {
    isInstalled,
    isLegacyEnvironment,
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
    usageData.sendUsageData(EventAction.OPEN_BASH, {
        platform: process.platform,
        arch: process.arch,
    });

    if (environment.type === 'legacy') {
        const directory = getToolchainDir(environment);
        exec(`"${path.resolve(directory, 'git-bash.exe')}"`, execCallback);
    } else {
        toolchainManager.launchWinBash(
            environment.version,
            persistedInstallDir()
        );
    }
};

const openCmd = (environment: Environment) => {
    logger.info('Open command prompt');
    usageData.sendUsageData(EventAction.OPEN_CMD, {
        platform: process.platform,
        arch: process.arch,
    });

    if (environment.type === 'legacy') {
        const directory = getToolchainDir(environment);
        exec(
            `start cmd /k "${path.resolve(directory, 'git-cmd.cmd')}"`,
            execCallback
        );
    } else {
        toolchainManager.launchTerminal(
            environment.version,
            persistedInstallDir()
        );
    }
};

const launchLegacyTerminal = {
    darwin: (toolchainDir: string) => {
        logger.info('Open terminal');
        usageData.sendUsageData(EventAction.OPEN_TERMINAL, {
            platform: process.platform,
            arch: process.arch,
        });
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
    usageData.sendUsageData(EventAction.OPEN_DIR, {
        platform: process.platform,
        arch: process.arch,
        directory,
    });
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
    const anyToolchainInProgress = useSelector(isAnyToolchainInProgress);

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
                            toolchainManager.launchTerminal(
                                environment.version,
                                persistedInstallDir()
                            );
                        } else if (hasGnomeTerminal()) {
                            toolchainManager.launchGnomeTerminal(
                                environment.version,
                                persistedInstallDir()
                            );
                        } else
                            dispatch(
                                showNrfUtilDialogAction({
                                    title: 'Terminal not supported',
                                    content:
                                        'Toolchain manager currently only supports GNOME terminal on Linux.\n\n' +
                                        'Alternatively you can use the nRF Connect for VS Code extension to open a terminal from within VS code.\n',
                                })
                            );
                    }}
                >
                    Open Terminal
                </Dropdown.Item>
            )}
            <Dropdown.Divider />
            {!isLegacyEnv && (
                <>
                    <Dropdown.Item
                        onClick={() =>
                            saveEnvScript(
                                environment.version,
                                process.platform === 'win32'
                                    ? 'undecided'
                                    : 'sh',
                                isLegacyEnvironment(environment.version)
                                    ? toolchainPath(environment.version)
                                    : environment.toolchainDir
                            )
                        }
                    >
                        Generate environment script
                    </Dropdown.Item>
                    <Dropdown.Divider />
                </>
            )}
            <Dropdown.Item onClick={() => openDirectory(sdkDir())}>
                Open SDK directory
            </Dropdown.Item>
            <Dropdown.Item onClick={() => openDirectory(toolchainDir)}>
                Open toolchain directory
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
                onClick={() =>
                    dispatch(cloneNcs(version, true, getAbortController()))
                }
            >
                Update SDK
            </Dropdown.Item>
            <Dropdown.Item
                onClick={() =>
                    dispatch(
                        installToolchain(
                            environment.version,
                            getAbortController()
                        )
                    )
                }
            >
                Update toolchain
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
                disabled={anyToolchainInProgress}
                onClick={() => dispatch(showConfirmRemoveDialog(version))}
            >
                Remove
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default EnvironmentMenu;
