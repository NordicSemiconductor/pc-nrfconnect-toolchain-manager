/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable import/first */
jest.mock('electron', () => ({
    remote: {
        require: () => ({
            exec: jest.fn(),
        }),
    },
}));

import path from 'path';

import { updateSettingsXml, userSettings } from './segger';

const testPath = '/test/path';
const toolchainDir = path.resolve(testPath, 'opt');
const zephyrBase = path.resolve(testPath, '..', 'zephyr');
const firstTimeUserSettings = userSettings(zephyrBase);
const existingUserSettings = 'User settings set by a user';

expect.extend({
    toContainNode(xmlString, nodeSelector, nodeContent) {
        const xml = new DOMParser().parseFromString(
            xmlString,
            'application/xml'
        );

        const node = xml.querySelector(nodeSelector);
        if (node == null) {
            return {
                pass: false,
                message: () => `
                    Expected to find a node matching the selector '${nodeSelector}'
                    but this XML does not contain such a node:
                    ${xmlString}
                `,
            };
        }

        if (node.textContent !== nodeContent) {
            return {
                pass: false,
                message: () => `
                    Expected that the node matching the selector '${nodeSelector}'
                    contains '${nodeContent}'
                    but it did contain '${node.textContent}' in this XML:
                    ${xmlString}
                `,
            };
        }

        return {
            pass: true,
            message: () => `
                Found a node matching the selector '${nodeSelector}'
                containing '${nodeContent}'
                while it should be absent from this XML:
                ${xmlString}
            `,
        };
    },
});

const expectNrfSettingAreCorrect = xml => {
    if (process.platform === 'win32') {
        expect(xml).toContainNode(
            'settings setting[name="Nordic/ToolchainDir"]',
            toolchainDir
        );
    }
    expect(xml).toContainNode(
        'settings setting[name="Nordic/ZephyrBase"]',
        zephyrBase
    );
    expect(xml).toContainNode(
        'settings setting[name="Nordic/CMakeExecutable"]',
        ''
    );
    expect(xml).toContainNode(
        'settings setting[name="Nordic/DTCExecutable"]',
        ''
    );
    expect(xml).toContainNode(
        'settings setting[name="Nordic/NinjaExecutable"]',
        ''
    );
    expect(xml).toContainNode(
        'settings setting[name="Nordic/PythonExecutable"]',
        ''
    );
};

const expectFirstTimeSettingAreCorrect = xml => {
    expectNrfSettingAreCorrect(xml);
    expect(xml).toContainNode(
        'settings setting[name="Environment/User Settings"]',
        firstTimeUserSettings
    );
};

const expectExistingUserSettingsAreRetained = xml => {
    expectNrfSettingAreCorrect(xml);
    expect(xml).toContainNode(
        'settings setting[name="Environment/User Settings"]',
        existingUserSettings
    );
};

describe('update segger settings', () => {
    it('updates existing settings', () => {
        const xml = `
            <!DOCTYPE CrossWorks_Settings_File>
            <settings>
                <setting name="Environment/Active Studio Theme">Light</setting>
                <setting name="Nordic/ToolchainDir">C:\\Users\\masc\\ncs\\v1.1.0\\toolchain\\opt</setting>
                <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
                <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
            </settings>
        `;
        const updatedSettings = updateSettingsXml(xml, testPath);

        expectNrfSettingAreCorrect(updatedSettings);
    });

    it('adds missing settings', () => {
        const xml = `
            <!DOCTYPE CrossWorks_Settings_File>
            <settings>
                <setting name="Environment/Active Studio Theme">Light</setting>
                <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
                <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
            </settings>
        `;
        const updatedSettings = updateSettingsXml(xml, testPath);

        expectNrfSettingAreCorrect(updatedSettings);
    });

    it('creates the xml', () => {
        const createdSettings = updateSettingsXml(null, testPath);

        expectFirstTimeSettingAreCorrect(createdSettings);
    });

    it('creates user settings if missing', () => {
        const xml = `
            <!DOCTYPE CrossWorks_Settings_File>
            <settings>
                <setting name="Environment/Active Studio Theme">Light</setting>
                <setting name="Nordic/ToolchainDir">C:\\Users\\masc\\ncs\\v1.1.0\\toolchain\\opt</setting>
                <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
                <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
            </settings>
        `;
        const updatedSettings = updateSettingsXml(xml, testPath);

        expectFirstTimeSettingAreCorrect(updatedSettings);
    });

    it('retains existing user settings', () => {
        const xml = `
            <!DOCTYPE CrossWorks_Settings_File>
            <settings>
                <setting name="Environment/Active Studio Theme">Light</setting>
                <setting name="Nordic/ToolchainDir">C:\\Users\\masc\\ncs\\v1.1.0\\toolchain\\opt</setting>
                <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
                <setting name="Environment/User Settings">${existingUserSettings}</setting>
                <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
            </settings>
        `;
        const updatedSettings = updateSettingsXml(xml, testPath);

        expectExistingUserSettingsAreRetained(updatedSettings);
    });
});
