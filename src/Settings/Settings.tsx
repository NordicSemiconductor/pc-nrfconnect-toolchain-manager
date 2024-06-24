/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Card,
    Toggle,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import {
    currentInstallDir,
    showSetInstallDirDialog,
} from '../InstallDir/installDirSlice';
import {
    arePreReleaseShown,
    isOlderEnvironmentsHidden,
    showOlderEnvironments,
    showPreReleases,
} from './settingsSlice';

export default () => {
    const dispatch = useDispatch();
    const installDir = useSelector(currentInstallDir);
    const disabled = process.platform === 'darwin';
    const olderEnvironmentsHidden = useSelector(isOlderEnvironmentsHidden);
    const preReleaseShown = useSelector(arePreReleaseShown);

    return (
        <div>
            <Card
                title={
                    <div className="tw-flex tw-flex-row tw-justify-between">
                        <div className="tw-flex tw-flex-col tw-justify-between tw-text-left">
                            <div className="tw-text-lg  tw-text-black">
                                Installation directory
                            </div>
                            <div className="tw-text-xs tw-font-light tw-text-gray-400">
                                {installDir?.trim()}
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            disabled={disabled}
                            onClick={() => dispatch(showSetInstallDirDialog())}
                        >
                            Select directory
                        </Button>
                    </div>
                }
            >
                <div className="tw-flex tw-flex-col tw-gap-2">
                    <div>
                        <Toggle
                            onToggle={() =>
                                dispatch(showPreReleases(!preReleaseShown))
                            }
                            isToggled={!preReleaseShown}
                            label="Hide pre-release versions"
                            variant="primary"
                        />
                        <div className="tw-text-xs tw-font-light tw-text-gray-400">
                            <div>
                                Hide environments that are pre-releases and not
                                installed
                            </div>
                        </div>
                    </div>

                    <div>
                        <Toggle
                            onToggle={() =>
                                dispatch(
                                    showOlderEnvironments(
                                        !olderEnvironmentsHidden
                                    )
                                )
                            }
                            isToggled={olderEnvironmentsHidden}
                            label="Show only 3 newest minor versions"
                            variant="primary"
                        />

                        <div className="tw-text-xs tw-font-light tw-text-gray-400">
                            <div>
                                Hide environments older than 3 minor versions.
                            </div>
                            <div>
                                Hide pre-releases when a corresponding release
                                is official.
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
