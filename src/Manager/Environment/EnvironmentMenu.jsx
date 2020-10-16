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

import './style.scss';

import React from 'react';
import { useDispatch } from 'react-redux';
import { exec, execSync } from 'child_process';
import path from 'path';
import { readdirSync } from 'fs';
import { shell } from 'electron';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { cloneNcs, install } from './environmentEffects';
import {
    isInstalled,
    toolchainDir as getToolchainDir,
    version as getVersion,
} from './environmentReducer';
import { showConfirmRemoveDialog } from '../managerReducer';

import environmentPropType from './environmentPropType';

const openBash = directory => {
    exec(`"${path.resolve(directory, 'git-bash.exe')}"`);
};

const openCmd = directory => {
    exec(`start cmd /k "${path.resolve(directory, 'git-cmd.cmd')}"`);
};

const openTerminal = {
    darwin: directory => {
        const d = path.dirname(directory);
        const gitversion = readdirSync(`${d}/toolchain/Cellar/git`).pop();
        const env = [
            `export PATH=${d}/toolchain/bin:$PATH`,
            `export GIT_EXEC_PATH=${d}/toolchain/Cellar/git/${gitversion}/libexec/git-core`,
            'export ZEPHYR_TOOLCHAIN_VARIANT=gnuarmemb',
            `export GNUARMEMB_TOOLCHAIN_PATH=${d}/toolchain`,
        ];
        exec(`osascript <<END
tell application "Terminal"
    do script "cd ${d} ; ${env.join(' ; ')} ; clear"
    activate
end tell
END`);
    },
    linux: (directory, version) => {
        const terminalApp = execSync(
            'gsettings get org.gnome.desktop.default-applications.terminal exec'
        )
            .toString()
            .trim()
            .replace(/'/g, '');
        const shortVer = version.replace(/\./g, '');
        exec(
            `${terminalApp} -l -e "snap run --shell ncs-toolchain-${shortVer}.west"`,
            { cwd: path.dirname(directory) }
        );
    },
};

const openDirectory = directory => {
    shell.openItem(directory);
};

const EnvironmentMenu = ({ environment }) => {
    const dispatch = useDispatch();
    const toolchainDir = getToolchainDir(environment);
    const version = getVersion(environment);
    const { platform } = process;

    return (
        <DropdownButton
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
