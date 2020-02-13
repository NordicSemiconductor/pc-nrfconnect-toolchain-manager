/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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

import path from 'path';
import { updateSettingsXml } from './segger';

const testPath = '/test/path';
const toolchainDir = path.resolve(testPath, 'opt');
const zephyrBase = path.resolve(testPath, '..', 'zephyr');

expect.extend({
    toContainNode(xmlString, nodeSelector, nodeContent) {
        const xml = new DOMParser().parseFromString(xmlString, 'application/xml');

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
    expect(xml).toContainNode('settings setting[name="Nordic/ToolchainDir"]', toolchainDir);
    expect(xml).toContainNode('settings setting[name="Nordic/ZephyrBase"]', zephyrBase);
    expect(xml).toContainNode('settings setting[name="Nordic/CMakeExecutable"]', '');
    expect(xml).toContainNode('settings setting[name="Nordic/DTCExecutable"]', '');
    expect(xml).toContainNode('settings setting[name="Nordic/NinjaExecutable"]', '');
    expect(xml).toContainNode('settings setting[name="Nordic/PythonExecutable"]', '');
};

const expectFirstTimeSettingAreCorrect = xml => {
    expectNrfSettingAreCorrect(xml);
    // expect(xml).toContainNode('settings setting[name="Environment/User Settings"]', '');
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

    // it('updates existing settings', () => {
    //     const xml = `
    //         <!DOCTYPE CrossWorks_Settings_File>
    //         <settings>
    //             <setting name="Environment/Active Studio Theme">Light</setting>
    //             <setting name="Nordic/ToolchainDir">C:\\Users\\masc\\ncs\\v1.1.0\\toolchain\\opt</setting>
    //             <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
    //             <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
    //         </settings>
    //     `;
    //     const updatedSettings = updateSettingsXml(xml, testPath);

    //     expectNrfSettingAreCorrect(updatedSettings);
    // });
});
