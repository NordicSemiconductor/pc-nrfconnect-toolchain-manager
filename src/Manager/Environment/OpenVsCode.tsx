/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';

import { Environment } from '../../state';
import { openVsCode } from '../../VsCodeDialog/vscode';
import Button from './Button';
import { isInProgress, isInstalled } from './environmentReducer';

export const OpenVsCode = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch();
    if (!isInstalled(environment)) return null;

    return (
        <Button
            icon="x-mdi-rocket"
            label="Open VS Code"
            title="Open Visual Studio Code"
            variant="primary"
            disabled={isInProgress(environment)}
            onClick={() => {
                dispatch(openVsCode());
            }}
        />
    );
};

export default OpenVsCode;
