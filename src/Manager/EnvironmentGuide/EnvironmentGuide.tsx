/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import DropdownButton from 'react-bootstrap/DropdownButton';
import {
    Button,
    classNames,
    DialogButton,
    ExternalLink,
    GenericDialog,
    InfoBox,
    NoticeBox,
    openUrl,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { isVsCodeInstalled } from '../../VsCodeDialog/vscode';
import { installLink } from '../../VsCodeDialog/VsCodeDialog';
import logo from './images/nrf_connect_for_vs_code.svg';
import sidebarManageSdkScreenshot from './images/sidebar_manage_sdk.png';
import activityBarImage from './images/vs_code_activity_bar.png';

import './index.scss';

interface Link {
    label: string;
    href: string;
}

export interface ResourceProps {
    label: string;
    description: string;
    link: Link;
}

const Resource = ({ label, description, link }: ResourceProps) => (
    <div>
        <b>{label}</b>
        <br />
        {description}
        <div className="tw-pt-0.5">
            <ExternalLink href={link.href} label={link.label} />
        </div>
    </div>
);

const DeveloperAcademy = () => (
    <NoticeBox
        mdiIcon="mdi-book-open-variant"
        color="tw-text-primary"
        title="Find out more in the Developer Academy"
        content={
            <p>
                Get the know-how to build wireless products using Nordic
                Semiconductor solutions.
                <br />
                <ExternalLink
                    href="https://academy.nordicsemi.com"
                    label="Nordic Developer Academy"
                />
            </p>
        }
    />
);

export default () => {
    const [vscodeModalVisible, setVscodeModalVisible] = useState(false);
    const [cliModalVisible, setCliModalVisible] = useState(false);

    const isInstalled = isVsCodeInstalled();
    const stepAdditive = isInstalled ? 0 : 1;

    const onWindows = process.platform === 'win32';

    return (
        <>
            <div className="tw-mb-2">
                <div className="tw-relative tw-flex tw-w-full tw-items-center tw-bg-white tw-p-4">
                    <div className="tw-flex tw-w-full tw-flex-row tw-items-center tw-justify-between tw-text-left">
                        <div className="tw-items-starttw-gap-1 tw-flex tw-h-full tw-w-fit tw-flex-col ">
                            <div className="tw-relative tw-flex tw-flex-row tw-items-center tw-py-4 tw-text-lg tw-font-medium">
                                nRF Connect SDK 3.0.0 and newer
                            </div>
                        </div>

                        <div className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-gap-2">
                            <div className="tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
                                <Button
                                    size="lg"
                                    onClick={() => setVscodeModalVisible(true)}
                                    variant="secondary"
                                >
                                    Install with VSCode
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={() => setCliModalVisible(true)}
                                    variant="secondary"
                                >
                                    Install with CLI
                                </Button>
                            </div>
                            <DropdownButton
                                id="environment-3.0.0"
                                variant="secondary"
                                title=""
                                alignRight
                                disabled
                            />
                        </div>
                    </div>
                </div>
            </div>

            <GenericDialog
                title="Install nRF Connect SDK with CLI"
                footer={
                    <DialogButton
                        variant="secondary"
                        onClick={() => setCliModalVisible(false)}
                    >
                        Close
                    </DialogButton>
                }
                size="m"
                isVisible={cliModalVisible}
            >
                <div className="modal-with-scrollbar tw-mb-2 tw-flex tw-flex-col tw-gap-4 tw-overflow-y-auto">
                    <Resource
                        label="Installing the nRF Connect SDK"
                        description="Install the nRF Connect toolchain and SDK."
                        link={{
                            href: 'https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/installation/install_ncs.html',
                            label: 'Manual installation instructions',
                        }}
                    />
                    <Resource
                        label="nRF Util"
                        description="A modular command line tool, enabling power users to manage Nordic Semiconductor devices and support automation."
                        link={{
                            href: 'https://docs.nordicsemi.com/bundle/nrfutil/page/README.html',
                            label: 'nRF Util documentation',
                        }}
                    />
                    <Resource
                        label="West"
                        description="A tool for managing multiple Git repositories and versions."
                        link={{
                            href: 'https://docs.nordicsemi.com/bundle/ncs-latest/page/zephyr/develop/west/index.html',
                            label: 'West overview',
                        }}
                    />
                    <div className="tw-mt-4">
                        <DeveloperAcademy />
                    </div>
                </div>
            </GenericDialog>

            <GenericDialog
                title="Install nRF Connect SDK with VS Code"
                footer={
                    <DialogButton
                        variant="secondary"
                        onClick={() => setVscodeModalVisible(false)}
                    >
                        Close
                    </DialogButton>
                }
                size="m"
                isVisible={vscodeModalVisible}
            >
                <div className="modal-with-scrollbar tw-mb-2 tw-overflow-y-auto">
                    <p>
                        Use the recommended nRF Connect Extension Pack for
                        building and debugging applications based on the nRF
                        Connect SDK in Visual Studio Code.
                    </p>

                    {!isInstalled && (
                        <>
                            <p className="tw-mt-4 tw-text-base tw-font-bold">
                                Step 1. Install VSCode
                            </p>
                            <p>
                                You first need to{' '}
                                <ExternalLink
                                    href={installLink()}
                                    label="download and install VS Code"
                                />
                                . As soon as you did that, this app will guide
                                you how to open Nordic Semiconductor&apos;s nRF
                                Connect for VS Code extension.
                            </p>
                            {onWindows && (
                                <p>
                                    If you already installed VS Code, it may be
                                    corrupt and you may need to reinstall it.
                                </p>
                            )}
                        </>
                    )}
                    <p className="tw-mt-4 tw-text-base tw-font-bold">
                        Step {1 + stepAdditive}. Open VSCode
                    </p>
                    <div className="tw-flex tw-flex-col tw-items-start">
                        <p>
                            Nordic Semiconductor&apos;s nRF Connect for VS Code
                            extension enhances the development experience for
                            all aspects of the nRF Connect SDK application
                            development in VS Code.
                        </p>
                        <p>
                            Click to open VS Code and install the nRF Connect
                            for VS Code extension.
                        </p>
                    </div>
                    <div className="mt-2">
                        <Button
                            size="lg"
                            variant="primary"
                            onClick={() => {
                                openUrl(
                                    'vscode://nordic-semiconductor.nrf-connect-extension-pack/quickstart'
                                );
                            }}
                        >
                            <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                                <img
                                    src={logo}
                                    alt="VS Code logo"
                                    className="tw-h-6 tw-w-6"
                                />
                                <span>Open VS Code with extension</span>
                            </div>
                        </Button>
                    </div>
                    <p className="tw-mt-4 tw-text-base tw-font-bold">
                        Step {2 + stepAdditive}. Open extension
                    </p>
                    <p>The extension is located in the VS Code activity bar.</p>
                    <div className="tw-flex">
                        <img
                            src={activityBarImage}
                            alt="VS Code activity bar with the nRF Connect icon higlighted"
                        />
                        <div className="tw-relative">
                            <span className="mdi mdi-arrow-left-thick tw-absolute tw-top-[127px] tw-text-3xl" />
                        </div>
                    </div>

                    <p className="tw-mt-4 tw-text-base tw-font-bold">
                        Step {3 + stepAdditive}. Install SDK
                    </p>
                    <p>
                        Find &quot;Manage Toolchains&quot; and &quot;Manage
                        SDKs&quot; in the welcome tab.
                    </p>
                    <img
                        className="tw-mt-2"
                        src={sidebarManageSdkScreenshot}
                        alt="VSCode Screenshot with extension"
                    />

                    <p className="tw-my-6">
                        Follow the instructions in the extension to install the
                        toolchain and the SDK, and start developing.
                    </p>

                    <InfoBox
                        mdiIcon="mdi-information-outline"
                        color="tw-text-amber-900"
                        title="Reminder"
                        content="Do not forget to install both SDK and toolchain, as they are installed separately."
                    />

                    <div className="tw-mt-4">
                        <DeveloperAcademy />
                    </div>
                </div>
            </GenericDialog>
        </>
    );
};
