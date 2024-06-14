/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import path from 'path';

import { Environment } from '../../state';
import { openVsCode } from '../../VsCodeDialog/vscode';
import { setVsCodeOpenDir } from '../../VsCodeDialog/vscodeSlice';
import sdkPath from '../sdkPath';
import Button from './Button';
import {
    isInProgress,
    isInstalled,
    toolchainDir as getToolchainDir,
} from './environmentReducer';

export const OpenVsCode = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch();
    if (!isInstalled(environment)) return null;

    const toolchainDir = getToolchainDir(environment);
    const isLegacyEnv = environment.type === 'legacy';
    const sdkDir = () =>
        isLegacyEnv ? path.dirname(toolchainDir) : sdkPath(environment.version);

    return (
        <Button
            icon="x-mdi-rocket"
            label="Open VS Code"
            title="Open Visual Studio Code"
            variant="primary"
            disabled={isInProgress(environment)}
            onClick={async () => {
                dispatch(setVsCodeOpenDir(await sdkDir()));
                dispatch(openVsCode());
            }}
        />
    );
};

export default OpenVsCode;
