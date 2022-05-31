/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
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

jest.mock('../../Manager/nrfutil/config', () => ({
    __esModule: true,
    default: jest.fn(() => ({})),
}));

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
                type: 'legacy',
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
