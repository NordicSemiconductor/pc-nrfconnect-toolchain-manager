/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';
import { dialog } from '@electron/remote';
import { ConfirmationDialog } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { installPackage } from '../Manager/Environment/effects/installPackage';
import {
    dndPackage,
    hideInstallPackageDialog,
    isInstallPackageDialogVisible,
} from '../Manager/managerSlice';

export default () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(isInstallPackageDialogVisible);
    const dnd = useSelector(dndPackage);
    const [pkg, setPkg] = useState('');
    useEffect(() => setPkg(dnd ?? ''), [dnd]);

    const onConfirm = () => {
        dispatch(installPackage(pkg));
        dispatch(hideInstallPackageDialog());
    };

    const getPackage = () => {
        dialog
            .showOpenDialog({
                title: 'Select nRF Connect SDK toolchain package',
                filters: [
                    { name: 'package', extensions: ['zip', 'dmg', 'snap'] },
                ],
            })
            .then(({ filePaths: [filePath] }) => {
                setPkg(filePath || '');
            });
    };

    return (
        <ConfirmationDialog
            isVisible={isVisible}
            title="Install toolchain package"
            onOptional={getPackage}
            optionalLabel="Select file"
            onConfirm={onConfirm}
            onCancel={() => dispatch(hideInstallPackageDialog())}
        >
            <Form.Group controlId="packageUrl">
                <Form.Label>
                    Path to nRF Connect SDK toolchain package:
                </Form.Label>
                <Form.Control
                    type="text"
                    value={pkg}
                    onChange={({ target }) => setPkg(target.value)}
                    onKeyPress={(evt: React.KeyboardEvent) =>
                        evt.key === 'Enter' && onConfirm()
                    }
                />
            </Form.Group>
        </ConfirmationDialog>
    );
};
