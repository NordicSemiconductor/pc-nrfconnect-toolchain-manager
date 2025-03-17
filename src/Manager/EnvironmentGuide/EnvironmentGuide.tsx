/*
 * Copyright (c) 2025 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import DropdownButton from 'react-bootstrap/DropdownButton';
import {
    Button,
    DialogButton,
    GenericDialog,
    openUrl,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import tabScreenshotCli from './images/tab_screenshot_cli.png';
import tabScreenshotVsc from './images/tab_screenshot_vsc.png';

export default () => {
    const [vscodeModalVisible, setVscodeModalVisible] = useState(false);
    const [cliModalVisible, setCliModalVisible] = useState(false);

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
                    <>
                        <DialogButton
                            variant="primary"
                            onClick={() => {
                                openUrl(
                                    'https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/installation/install_ncs.html'
                                );
                            }}
                        >
                            <span>Open installation page</span>
                        </DialogButton>
                        <DialogButton
                            variant="secondary"
                            onClick={() => setCliModalVisible(false)}
                        >
                            Close
                        </DialogButton>
                    </>
                }
                size="m"
                isVisible={cliModalVisible}
            >
                <div className="tw-flex tw-flex-col tw-gap-2 tw-overflow-y-auto">
                    <p>
                        Use the recommended proprietary tools from Nordic
                        Semiconductor and Zephyr for building and debugging
                        applications from command line.
                    </p>
                    <p>
                        To install the required tools and set up the nRF Connect
                        SDK and the command line environment, follow the steps
                        on the installing the nRF Connect SDK page and select
                        the Command line tab:
                    </p>

                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-8">
                        <div className="tw-flex tw-flex-col tw-px-4 tw-py-2 tw-shadow-md">
                            <img
                                src={tabScreenshotCli}
                                alt="Docs Tab screenshot"
                                style={{ maxWidth: 350 }}
                            />
                            <p className="tw-text-end tw-text-xs tw-italic tw-text-gray-400">
                                Tab selection in the documentation
                            </p>
                        </div>
                    </div>
                </div>
            </GenericDialog>

            <GenericDialog
                title="Install nRF Connect SDK with VS Code"
                footer={
                    <>
                        <DialogButton
                            variant="primary"
                            onClick={() => {
                                openUrl(
                                    'https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/installation/install_ncs.html'
                                );
                            }}
                        >
                            <span>Open installation page</span>
                        </DialogButton>
                        <DialogButton
                            variant="secondary"
                            onClick={() => setVscodeModalVisible(false)}
                        >
                            Close
                        </DialogButton>
                    </>
                }
                size="m"
                isVisible={vscodeModalVisible}
            >
                <div className="tw-mb-2 tw-overflow-y-auto">
                    <p>
                        Use the recommended nRF Connect Extension Pack for
                        building and debugging applications based on the nRF
                        Connect SDK in Visual Studio Code.
                    </p>
                    <p>
                        To install the extension pack and the nRF Connect SDK,
                        follow the steps on the installing the nRF Connect SDK
                        page and select the nRF Connect for VCS tab:
                    </p>

                    <div className="tw-flex tw-flex-col tw-items-center tw-gap-8">
                        <div className="tw-flex tw-flex-col tw-px-4 tw-py-2 tw-shadow-md">
                            <img
                                src={tabScreenshotVsc}
                                alt="Docs Tab screenshot"
                                style={{ maxWidth: 350 }}
                            />
                            <p className="tw-text-end tw-text-xs tw-italic tw-text-gray-400">
                                Tab selection in the documentation
                            </p>
                        </div>
                    </div>
                </div>
            </GenericDialog>
        </>
    );
};
