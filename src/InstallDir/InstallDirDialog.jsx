/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React from 'react';
import { bool } from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { remote } from 'electron';

import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import { installDir, setInstallDir } from '../persistentStore';
import {
    checkLocalEnvironments,
    downloadIndex,
    install,
} from '../Manager/managerActions';
import { clearEnvironmentList, environmentToInstall } from '../Manager/managerReducer';
import { hideInstallDirDialog, isDialogVisible } from './installDirReducer';


const selectInstallDir = async dispatch => {
    const selection = remote.dialog.showOpenDialog({
        title: 'Select installation directory',
        defaultPath: installDir(),
        properties: ['openDirectory', 'createDirectory'],
    });
    if (selection) {
        setInstallDir(selection[0]);
        dispatch(clearEnvironmentList());
        dispatch(checkLocalEnvironments());
        await dispatch(downloadIndex());
        dispatch(hideInstallDirDialog());
    }
};

const InstallDirDialog = ({ justConfirm }) => {
    const dispatch = useDispatch();
    const isVisible = useSelector(isDialogVisible);
    const environment = useSelector(environmentToInstall);

    const confirmDirDialogProps = {
        title: 'Confirm installation directory',
        onConfirm: () => selectInstallDir(dispatch),
        onCancel: () => dispatch(hideInstallDirDialog()),
    };
    const changeDirDialogProps = {
        title: 'Change install directory',
        confirmLabel: 'Continue installation',
        optionalLabel: 'Change directory',
        onConfirm: () => dispatch(install(environment)),
        onCancel: () => dispatch(hideInstallDirDialog()),
        onOptional: () => dispatch(selectInstallDir()),
    };
    const dialogProps = justConfirm ? confirmDirDialogProps : changeDirDialogProps;

    return (
        <ConfirmationDialog
            isVisible={isVisible}
            {...dialogProps}
        >
            <p>
                <code>{installDir()}</code> is your current installation base directory.
            Any new installation will be a subdirectory here.
            </p>
            <p>
            When you change the installation directory, SDK environments installed in the old
            directory will not be shown in the list anymore. They will not be deleted, so
            you can still find them on the disc and changing back to the old directory will
            show them in the manager again.
            </p>
        </ConfirmationDialog>
    );
};
InstallDirDialog.propTypes = {
    justConfirm: bool,
};
InstallDirDialog.defaultProps = {
    justConfirm: false,
};

export default InstallDirDialog;
