/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmationDialog from '../../ConfirmationDialog/ConfirmationDialog';
import {
    environmentToRemove,
    hideConfirmRemoveDialog,
    isRemoveDirDialogVisible,
} from '../managerSlice';
import { removeEnvironment } from './effects/removeEnvironment';
import { version } from './environmentReducer';

export default () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(isRemoveDirDialogVisible);
    const environment = useSelector(environmentToRemove) || {};

    return (
        <ConfirmationDialog
            isVisible={isVisible}
            title="Remove environment"
            onCancel={() => dispatch(hideConfirmRemoveDialog())}
            onConfirm={() => {
                dispatch(hideConfirmRemoveDialog());
                dispatch(removeEnvironment(environment));
            }}
        >
            Are you sure you want to remove <code>{version(environment)}</code>{' '}
            environment?
        </ConfirmationDialog>
    );
};
