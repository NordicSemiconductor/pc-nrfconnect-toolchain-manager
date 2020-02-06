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

/* This test is disabled, because it needs a newer vesion of jest than we currently have in shared.
   This test needs jest 25, but we currently only have jest 24 there. When upgrading to jest 25,
   we also experienced some problems with jsdom (SecurityError: localStorage is not available for
    opaque origins). This was fixed by setting testURL to http://localhost/ but we not not know yet
    whether this might break other things. */
xdescribe('update segger settings', () => {
    it('updates existing settings', () => {
        const xml = `<!DOCTYPE CrossWorks_Settings_File>
<settings>
    <setting name="Environment/Active Studio Theme">Light</setting>
    <setting name="Nordic/ToolchainDir">C:\\Users\\masc\\ncs\\v1.1.0\\toolchain\\opt</setting>
    <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
    <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
</settings>`;
        const updatedSettings = updateSettingsXml(xml, testPath);

        expect(updatedSettings).toContain(`<setting name="Nordic/ToolchainDir">${toolchainDir}</setting>`);
        expect(updatedSettings).toContain(`<setting name="Nordic/ZephyrBase">${zephyrBase}</setting>`);
    });

    it('adds missing settings', () => {
        const xml = `<!DOCTYPE CrossWorks_Settings_File>
<settings>
    <setting name="Environment/Active Studio Theme">Light</setting>
    <setting name="Nordic/ZephyrBase">C:\\Users\\masc\\ncs\\v1.1.0\\zephyr</setting>
    <setting name="Text Editor/Font">Consolas,10,-1,5,50,0,0,0,0,0</setting>
</settings>`;
        const updatedSettings = updateSettingsXml(xml, testPath);

        expect(updatedSettings).toContain(`<setting name="Nordic/ToolchainDir">${toolchainDir}</setting>`);
        expect(updatedSettings).toContain(`<setting name="Nordic/ZephyrBase">${zephyrBase}</setting>`);
    });

    it('creates the xml', () => {
        const createdSettings = updateSettingsXml(null, testPath);

        expect(createdSettings).toBe('<settings>'
        + `<setting name="Nordic/ZephyrBase">${zephyrBase}</setting>`
        + `<setting name="Nordic/ToolchainDir">${toolchainDir}</setting>`
        + '</settings>');
    });
});
