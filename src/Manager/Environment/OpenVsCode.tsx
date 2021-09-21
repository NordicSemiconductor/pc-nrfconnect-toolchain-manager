/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isVsCodeEnabled } from '../../Settings/settingsSlice';
import { Environment } from '../../state';
import { TDispatch } from '../../thunk';
import { openVsCode, showVsCodeDialog } from '../../VsCodeDialog/vscode';
import {
    setVsCodeDialogHidden,
    VsCodeStatus,
    vsCodeStatus,
} from '../../VsCodeDialog/vscodeSlice';
import Button from './Button';
import environmentPropType from './environmentPropType';
import { isInProgress, isInstalled } from './environmentReducer';

export const OpenVsCode = ({ environment }: { environment: Environment }) => {
    const dispatch = useDispatch<TDispatch>();
    const status = useSelector(vsCodeStatus);
    if (!useSelector(isVsCodeEnabled)) return <></>;
    if (!isInstalled(environment)) return <></>;

    return (
        <Button
            icon="x-mdi-rocket"
            label={
                status === VsCodeStatus.INSTALLED
                    ? 'Open VS Code'
                    : 'Install VS Code'
            }
            title={
                status === VsCodeStatus.INSTALLED
                    ? 'Open Visual Studio Code'
                    : 'Install Visual Studio Code'
            }
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
