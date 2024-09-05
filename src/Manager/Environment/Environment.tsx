/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';

import { Environment as Model } from '../../state';
import Cancel from './Cancel';
import EnvironmentMenu from './EnvironmentMenu';
import { progressLabel } from './environmentReducer';
import Install from './Install';
import {
    generateArchFromEnvironment,
    generateNameFromEnvironment,
} from './Name';
import OpenSegger from './OpenSegger';
import { OpenVsCode } from './OpenVsCode';
import ProgressBar from './ProgressBar';
import ShowFirstSteps from './ShowFirstSteps';

import './style.scss';

export default ({ environment }: { environment: Model }) => {
    const arch = generateArchFromEnvironment(environment);

    return (
        <div className="tw-relative tw-flex tw-w-full tw-items-center tw-bg-white tw-p-4">
            <div className="tw-flex tw-w-full tw-flex-row tw-items-center tw-justify-between tw-text-left">
                <div className="tw-items-starttw-gap-1 tw-flex tw-h-full tw-w-fit tw-flex-col ">
                    <div className="tw-relative tw-flex tw-flex-row tw-items-center tw-py-4 tw-text-lg tw-font-medium">
                        {generateNameFromEnvironment(environment)}
                        {arch && (
                            <span className="tw-pl-3 tw-text-sm tw-font-light tw-text-gray-500">
                                {` ${arch}`}
                            </span>
                        )}
                        <div className="tw-absolute tw-bottom-0 tw-h-4 tw-text-xs tw-font-normal tw-italic tw-text-gray-400">
                            {progressLabel(environment)}
                        </div>
                    </div>
                </div>

                <div className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-gap-2">
                    <div className="tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
                        <ShowFirstSteps environment={environment} />
                        <Install environment={environment} />
                        <Cancel environment={environment} />
                        <OpenVsCode environment={environment} />
                        <OpenSegger environment={environment} />
                    </div>
                    <EnvironmentMenu environment={environment} />
                </div>
            </div>
            <ProgressBar environment={environment} />
        </div>
    );
};
