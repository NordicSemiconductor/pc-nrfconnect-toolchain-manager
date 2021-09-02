/* Copyright (c) 2015 - 2020, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { useDispatch } from 'react-redux';
import { exec, ExecException, execSync } from 'child_process';
import { remote, shell } from 'electron';
import { readdirSync } from 'fs';
import path from 'path';
import { logger, usageData } from 'pc-nrfconnect-shared';

import { Environment } from '../../state';
import EventAction from '../../usageDataActions';
import { showConfirmRemoveDialog } from '../managerReducer';
import { cloneNcs } from './effects/cloneNcs';
import { install } from './effects/installEnvironment';
import environmentPropType from './environmentPropType';
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

const { exec: remoteExec } = remote.require('child_process');

const openBash = (directory: string) => {
    logger.info('Open bash');
    usageData.sendUsageData(
        EventAction.OPEN_BASH,
        `${process.platform}; ${process.arch}`
    );
    exec(`"${path.resolve(directory, 'git-bash.exe')}"`, execCallback);
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
            `PATH=${toolchainDir}/bin:${toolchainDir}/usr/bin:${toolchainDir}/segger_embedded_studio/bin:${remote.process.env.PATH}`,
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
    shell.openItem(directory);
};

type EnvironmentMenuProps = { environment: Environment };
const EnvironmentMenu = ({ environment }: EnvironmentMenuProps) => {
    const dispatch = useDispatch();
    const toolchainDir = getToolchainDir(environment);
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
                    <Dropdown.Item onClick={() => openBash(toolchainDir)}>
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
                        /* @ts-ignore */
                        openTerminal[platform](toolchainDir, version)
                    }
                >
                    Open Terminal
                </Dropdown.Item>
            )}
            <Dropdown.Divider />
            <Dropdown.Item
                onClick={() => openDirectory(path.dirname(toolchainDir))}
            >
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
EnvironmentMenu.propTypes = { environment: environmentPropType.isRequired };

export default EnvironmentMenu;
