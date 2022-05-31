/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import BootstrapProgressBar from 'react-bootstrap/ProgressBar';

import { Environment } from '../../state';
import {
    isCloningSdk,
    isInProgress,
    isInstalled,
    isInstallingToolchain,
    isRemoving,
    progress,
} from './environmentReducer';

import './style.scss';

const className = (env: Environment) => {
    switch (true) {
        case isRemoving(env):
            return 'removing';
        case isInstallingToolchain(env):
            return 'installing';
        case isCloningSdk(env):
            return 'installing';
        case isInstalled(env):
            return 'installed';
        default:
            return 'available';
    }
};

const progressOrFullBar = (environment: Environment) =>
    isInProgress(environment) && progress(environment) === undefined
        ? 100
        : progress(environment);

type Props = { environment: Environment };

const ProgressBar = ({ environment }: Props) => (
    <BootstrapProgressBar
        now={progressOrFullBar(environment)}
        striped={isInProgress(environment)}
        animated={isInProgress(environment)}
        className={className(environment)}
    />
);

export default ProgressBar;
