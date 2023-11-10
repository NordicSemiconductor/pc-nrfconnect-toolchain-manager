/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import initEnvironments from '../Manager/initEnvironments';
import {
    hideSetToolchainSourceDialog,
    isDialogVisible,
    setToolchainSource,
    toolchainRootUrl,
} from './toolchainSourceSlice';

export default () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(isDialogVisible);
    const savedUrl = useSelector(toolchainRootUrl);
    const [url, setUrl] = useState(savedUrl);

    const onConfirm = () => {
        dispatch(setToolchainSource(url));
        dispatch(hideSetToolchainSourceDialog());
        dispatch(initEnvironments());
    };

    return (
        <ConfirmationDialog
            isVisible={isVisible}
            title="Toolchain source URL"
            onConfirm={onConfirm}
            onCancel={() => dispatch(hideSetToolchainSourceDialog())}
        >
            <Form.Group controlId="toolchainSourceUrl">
                <Form.Label>Specify toolchain source URL:</Form.Label>
                <Form.Control
                    type="text"
                    value={url}
                    onChange={({ target }) => setUrl(target.value)}
                    onKeyPress={(evt: React.KeyboardEvent) =>
                        evt.key === 'Enter' && onConfirm()
                    }
                />
            </Form.Group>
        </ConfirmationDialog>
    );
};
