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

import React from 'react';

import { addEnvironment } from '../../Manager/managerSlice';
import { render } from '../../testUtils';
import VsCodeDialog from '../VsCodeDialog';
import {
    setVsCodeExtensions,
    setVsCodeStatus,
    showVsCodeDialog,
    VsCodeExtensionState,
    VsCodeStatus,
} from '../vscodeSlice';

const vsCodeDialogActions = (status: VsCodeStatus) => [
    showVsCodeDialog(),
    setVsCodeStatus(status),
];

const vsCodeExtensions = (size: number, installedCount: number) => {
    if (size <= 0 || size < installedCount) return [];
    const extensions = [];
    for (let i = 0; i < size; i += 1) {
        extensions.push({
            identifier: i.toString(),
            name: `Extension ${i.toString()}`,
            state:
                i < installedCount
                    ? VsCodeExtensionState.INSTALLED
                    : VsCodeExtensionState.NOT_INSTALLED,
        });
    }
    return extensions;
};

describe('Default loading view when showing VS Code Dialog', () => {
    it('should display a "checking" dialog', async () => {
        const screen = render(<VsCodeDialog />, [showVsCodeDialog()]);

        expect(
            await screen.findByText(
                'Checking if VS Code and dependencies are installed.',
                { exact: false }
            )
        ).toBeInTheDocument();
    });
});

describe('VS Code not installed when showing VS Code Dialog', () => {
    it('should display a "Install VS Code" dialog', async () => {
        const screen = render(<VsCodeDialog />, [
            ...vsCodeDialogActions(VsCodeStatus.NOT_INSTALLED),
        ]);

        expect(
            await screen.findByText(
                'VS Code was not detected on your system.',
                { exact: false }
            )
        ).toBeInTheDocument();
    });
});

describe('VS Code installed but some extensions missing when showing VS Code Dialog', () => {
    it('should display a "Install VS Code extensions" dialog', async () => {
        const screen = render(<VsCodeDialog />, [
            ...vsCodeDialogActions(VsCodeStatus.MISSING_EXTENSIONS),
        ]);

        expect(
            await screen.findByText(
                'For developing nRF applications with VS Code we recommend using the following extensions',
                { exact: false }
            )
        ).toBeInTheDocument();
    });
});

describe('VS Code installed but some extensions missing when showing VS Code Dialog', () => {
    it('should display the correct status icons and buttons', async () => {
        const screen = render(<VsCodeDialog />, [
            ...vsCodeDialogActions(VsCodeStatus.MISSING_EXTENSIONS),
            setVsCodeExtensions(vsCodeExtensions(5, 2)),
        ]);

        expect(
            await screen.findAllByAltText('Not installed', {
                exact: true,
            })
        ).toHaveLength(3);
        expect(
            await screen.findAllByAltText('Installed', {
                exact: true,
            })
        ).toHaveLength(2);
        expect(await screen.findAllByRole('button')).toHaveLength(3);
    });
});

describe('Missing VS Code extensions were installed through the dialog', () => {
    it('should display the correct status icons and buttons', async () => {
        const screen = render(<VsCodeDialog />, [
            ...vsCodeDialogActions(VsCodeStatus.MISSING_EXTENSIONS),
            setVsCodeExtensions(vsCodeExtensions(2, 2)),
        ]);

        expect(await screen.findAllByRole('button')).toHaveLength(2);
    });
});

describe('Missing VS Code extensions were installed through the dialog but failed', () => {
    it('should display error status icons and alert', async () => {
        const screen = render(<VsCodeDialog />, [
            ...vsCodeDialogActions(VsCodeStatus.MISSING_EXTENSIONS),
            setVsCodeExtensions([
                {
                    identifier: 'test',
                    name: 'Extension test',
                    state: VsCodeExtensionState.FAILED,
                },
            ]),
        ]);

        expect(
            await screen.findAllByAltText('Failed to install', {
                exact: true,
            })
        ).toHaveLength(1);
        expect(
            await screen.findByText('Some extensions failed to install', {
                exact: false,
            })
        ).toBeInTheDocument();
    });
});

describe('VS Code is installed but nRF Command line tools are missing', () => {
    it('should display a "Install nRF Command line tools" dialog', async () => {
        const screen = render(<VsCodeDialog />, [
            ...vsCodeDialogActions(VsCodeStatus.MISSING_NRFJPROG),
        ]);

        expect(
            await screen.findByText('install nRF Command Line Tools', {
                exact: true,
            })
        ).toBeInTheDocument();
    });
});

describe('VS Code not installed when installing a toolchain for the first time', () => {
    it('should display a "While the toolchain is installing ... install VS Code" dialog', async () => {
        const screen = render(<VsCodeDialog />, [
            addEnvironment({
                version: 'v0.0',
                toolchainDir: '',
                isWestPresent: false,
                isInstalled: false,
                toolchains: [],
                isInstallingToolchain: true,
                isCloningSdk: true,
                isRemoving: false,
                progress: 0,
                stage: 'Downloading',
            }),
            ...vsCodeDialogActions(VsCodeStatus.NOT_INSTALLED),
        ]);

        expect(
            await screen.findByText(
                'While the toolchain is installing we recommend you to ',
                { exact: false }
            )
        ).toBeInTheDocument();
    });
});
