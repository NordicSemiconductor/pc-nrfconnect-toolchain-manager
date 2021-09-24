/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';

import { Environment } from '../../state';
import { TDispatch } from '../../thunk';
import { openVsCode, showVsCodeDialog } from '../../VsCodeDialog/vscode';
import {
    setVsCodeDialogHidden,
    VsCodeStatus,
} from '../../VsCodeDialog/vscodeSlice';
import Button from './Button';
import environmentPropType from './environmentPropType';
import { isInProgress, isInstalled } from './environmentReducer';

export const OpenVsCode = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch<TDispatch>();
    if (!isInstalled(environment)) return null;

    return (
        <Button
            icon="x-mdi-rocket"
            label="Open VS Code"
            title="Open Visual Studio Code"
            variant="primary"
            disabled={isInProgress(environment)}
            onClick={() => {
                dispatch(showVsCodeDialog()).then((s: VsCodeStatus) => {
                    if (s === VsCodeStatus.INSTALLED) {
                        dispatch(setVsCodeDialogHidden());
                        openVsCode();
                    }
                });
            }}
        />
    );
};

OpenVsCode.propTypes = { environment: environmentPropType.isRequired };

export default OpenVsCode;
