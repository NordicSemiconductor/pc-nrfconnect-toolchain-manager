/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dialog } from '@electron/remote';
import { AppThunk } from '@nordicsemiconductor/pc-nrfconnect-shared';

import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { install } from '../Manager/Environment/effects/installEnvironment';
import initEnvironments from '../Manager/initEnvironments';
import { RootState } from '../state';
import {
    currentInstallDir,
    environmentToInstall,
    hideInstallDirDialog,
    isConfirmDirFlavour,
    isDialogVisible,
    setInstallDir,
} from './installDirSlice';

const selectInstallDir =
    (
        hideDialog: boolean,
        installDir?: string
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        const {
            filePaths: [filePath],
        } = await dialog.showOpenDialog({
            title: 'Select installation directory',
            defaultPath: installDir,
            properties: ['openDirectory', 'createDirectory'],
        });
        if (filePath) {
            dispatch(setInstallDir(filePath));
            dispatch(initEnvironments());
            if (hideDialog) {
                dispatch(hideInstallDirDialog());
            }
        }
    };

export default () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(isDialogVisible);
    const environment = useSelector(environmentToInstall);
    const isConfirmFlavour = useSelector(isConfirmDirFlavour);
    const installDir = useSelector(currentInstallDir);

    const confirmDirDialogProps = {
        title: 'Confirm installation directory',
        confirmLabel: 'Continue installation',
        onConfirm: () => {
            dispatch(hideInstallDirDialog());
            dispatch(install(environment, false));
        },
        onCancel: () => dispatch(hideInstallDirDialog()),
        optionalLabel: 'Change directory',
        onOptional: () => dispatch(selectInstallDir(false, installDir)),
    };
    const changeDirDialogProps = {
        title: 'Change install directory',
        onConfirm: () => dispatch(selectInstallDir(true, installDir)),
        onCancel: () => dispatch(hideInstallDirDialog()),
    };
    const dialogProps = isConfirmFlavour
        ? confirmDirDialogProps
        : changeDirDialogProps;

    return (
        <ConfirmationDialog isVisible={isVisible} {...dialogProps}>
            <p>
                <code>{installDir}</code> is your current installation base
                directory. Any new installation will be a subdirectory here.
            </p>
            <p>
                When you change the installation directory, SDK environments
                installed in the old directory will not be shown in the list
                anymore. They will not be deleted, so you can still find them on
                the disc and changing back to the old directory will show them
                in the manager again.
            </p>
        </ConfirmationDialog>
    );
};
