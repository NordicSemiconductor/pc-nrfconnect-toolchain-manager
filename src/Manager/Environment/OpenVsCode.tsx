/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Environment } from '../../state';
import { openVsCode, VsCodeStatus } from '../../VsCodeDialog/vscode';
import {
    setToolchainDir,
    showVsCodeDialog,
} from '../../VsCodeDialog/vscodeSlice';
import { isVsCodeEnabled } from '../managerReducer';
import Button from './Button';
import environmentPropType from './environmentPropType';
import { isInProgress, isInstalled } from './environmentReducer';

export const OpenVsCode = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch();
    if (!useSelector(isVsCodeEnabled)) return <></>;
    if (!isInstalled(environment)) return <></>;

    return (
        <Button
            icon="x-mdi-rocket"
            label="Open VS Code"
            title="Open Visual Studio Code"
            variant="primary"
            disabled={isInProgress(environment)}
            onClick={() => {
                dispatch(setToolchainDir(environment.toolchainDir));
                dispatch(showVsCodeDialog()).then((status: VsCodeStatus) => {
                    if (status === VsCodeStatus.INSTALLED)
                        openVsCode(environment.toolchainDir);
                });
            }}
        />
    );
};

OpenVsCode.propTypes = { environment: environmentPropType.isRequired };

export default OpenVsCode;
