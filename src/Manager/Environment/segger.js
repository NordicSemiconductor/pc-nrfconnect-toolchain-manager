/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
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

import { exec } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { remote } from 'electron';
import fse from 'fs-extra';
import { logger } from 'pc-nrfconnect-shared';

import {
    EventAction,
    sendErrorReport,
    sendUsageData,
} from '../../usageDataActions';

const { exec: remoteExec } = remote.require('child_process');

const findOrCreateSettingsNode = xml => {
    let settings = xml.querySelector('settings');
    if (settings == null) {
        settings = xml.createElement('settings');
        xml.append(settings);
    }

    return settings;
};

const createSettingNode = (xml, settingName) => {
    const settingNode = xml.createElement('setting');
    settingNode.setAttribute('name', settingName);

    findOrCreateSettingsNode(xml).append(settingNode);

    return settingNode;
};

const setSetting = (
    xml,
    settingName,
    settingValue,
    overwriteExistingSetting = true
) => {
    let node = xml.querySelector(`setting[name='${settingName}']`);
    if (!overwriteExistingSetting && node !== null) {
        return;
    }
    if (node === null) {
        node = createSettingNode(xml, settingName);
    }
    node.textContent = settingValue;
};

export const userSettings = zephyrDir => {
    const cmakeLists = `ARM/Zephyr/CMakeLists=${path.resolve(
        zephyrDir,
        'samples',
        'basic',
        'blinky',
        'CMakeLists.txt'
    )};`;
    const buildDir = `ARM/Zephyr/BuildDir=${path.resolve(
        zephyrDir,
        'samples',
        'basic',
        'blinky',
        'build_nrf9160_pca10090'
    )};`;
    const boardDir = `ARM/Zephyr/BoardDir=${path.resolve(
        zephyrDir,
        'boards',
        'arm',
        'nrf9160_pca10090'
    )};`;
    return `${cmakeLists}${buildDir}${boardDir}`.replace(/\\/g, '/');
};

const createXmlDocument = xmlString => {
    let xml = new DOMParser().parseFromString(xmlString, 'application/xml');
    if (xml.querySelector('parsererror') !== null) {
        xml = new Document();
    }
    return xml;
};

export const updateSettingsXml = (xmlString, toolchainDir) => {
    const xml = createXmlDocument(xmlString);

    const zephyrDir = path.resolve(toolchainDir, '..', 'zephyr');
    setSetting(xml, 'Nordic/ZephyrBase', zephyrDir);
    if (process.platform === 'win32') {
        setSetting(
            xml,
            'Nordic/ToolchainDir',
            path.resolve(toolchainDir, 'opt')
        );
    } else {
        setSetting(xml, 'Nordic/ToolchainDir', toolchainDir);
    }
    setSetting(xml, 'Nordic/CMakeExecutable', '');
    setSetting(xml, 'Nordic/DTCExecutable', '');
    setSetting(xml, 'Nordic/NinjaExecutable', '');
    setSetting(xml, 'Nordic/PythonExecutable', '');
    setSetting(
        xml,
        'Environment/User Settings',
        userSettings(zephyrDir),
        false
    );

    return new XMLSerializer().serializeToString(xml);
};

const updateConfigXml = (xmlString, toolchainDir) => {
    const xml = createXmlDocument(xmlString);

    const node = xml.querySelector(
        `environment-settings switch ${
            process.platform === 'darwin' ? 'case[value=macos]' : 'default'
        }`
    );
    const binDir =
        process.platform === 'win32'
            ? path.resolve(toolchainDir, 'opt', 'bin')
            : path.resolve(toolchainDir, 'bin');
    const ext = process.platform === 'win32' ? '.exe' : '';
    [
        ['CMAKE', 'cmake'],
        ['NINJA', 'ninja'],
        ['PYTHON', process.platform === 'win32' ? 'python' : 'python3'],
        ['DTC', 'dtc'],
    ].forEach(([name, command]) => {
        node.querySelector(`define[name=DEFAULT_${name}_PATH]`).setAttribute(
            'value',
            path.resolve(binDir, `${command}${ext}`)
        );
    });
    return new XMLSerializer().serializeToString(xml);
};

const readFile = filePath => {
    try {
        return fs.readFileSync(filePath);
    } catch (error) {
        // The file may be just not there yet, so we treat this case not as an error
        sendErrorReport(error.message || error);
        return null;
    }
};

const updateSettingsFile = (settingsFileName, toolchainDir) => {
    const seggerSettingsDir = path.resolve(
        os.homedir(),
        'Nordic/SEGGER Embedded Studio/v3'
    );
    fse.mkdirpSync(seggerSettingsDir);
    const settingsPath = path.resolve(seggerSettingsDir, settingsFileName);

    const xml = readFile(settingsPath);
    if (xml) {
        const updatedXml = updateSettingsXml(xml, toolchainDir);
        fs.writeFileSync(settingsPath, updatedXml);
    }
};

export const updateConfigFile = toolchainDir => {
    logger.info('Update config file');
    if (process.platform === 'linux') {
        // on Linux SES is executed from snap which will always set correct PATH
        return;
    }
    const configPath = path.resolve(
        toolchainDir,
        'segger_embedded_studio',
        'bin',
        'config.xml'
    );
    let xmlContent = readFile(configPath);
    if (xmlContent) {
        xmlContent = updateConfigXml(xmlContent, toolchainDir);
        if (xmlContent) {
            fs.writeFileSync(configPath, xmlContent);
        }
    }
};

export const openSegger = async (toolchainDir, version) => {
    logger.info('Open Segger Embedded Studio');
    sendUsageData(EventAction.OPEN_SES, process.platform);

    await Promise.all([
        updateSettingsFile('settings.xml', toolchainDir),
        updateSettingsFile('settings.xml.bak', toolchainDir),
    ]);

    const cwd = path.dirname(toolchainDir);
    const execCallback = (error, stdout, stderr) => {
        logger.info('Segger Embedded Studio has closed');
        if (error) sendErrorReport(error);
        if (stderr) sendErrorReport(stderr);
        if (stdout) logger.debug(stdout);
    };

    switch (process.platform) {
        case 'win32':
            exec(
                `"${path.resolve(toolchainDir, 'SEGGER Embedded Studio.cmd')}"`,
                { cwd },
                execCallback
            );
            break;
        case 'darwin':
            exec(
                `open "${toolchainDir}/segger_embedded_studio/SEGGER Embedded Studio.app"`,
                {
                    env: {
                        PATH: `${toolchainDir}/bin:${remote.process.env.PATH}`,
                        ZEPHYR_TOOLCHAIN_VARIANT: 'gnuarmemb',
                        GNUARMEMB_TOOLCHAIN_PATH: toolchainDir,
                    },
                    cwd,
                },
                execCallback
            );
            break;
        case 'linux': {
            const shortVer = version.replace(/\./g, '');
            remoteExec(
                `ncs-toolchain-${shortVer}.emstudio`,
                { cwd },
                execCallback
            );
            break;
        }
        default:
    }
};
