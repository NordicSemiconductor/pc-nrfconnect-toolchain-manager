/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { bool, func, string } from 'prop-types';

const ConfirmationDialog: FC<Props> = ({
    title,
    children,
    isVisible,
    onCancel = null,
    onConfirm,
    onOptional = null,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    optionalLabel = null,
}) => (
    <Modal show={isVisible} onHide={onCancel || onConfirm} backdrop>
        <Modal.Header closeButton={false}>
            <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>
            {onOptional && (
                <Button variant="outline-primary" onClick={onOptional}>
                    {optionalLabel}
                </Button>
            )}
            <Button variant="primary" onClick={onConfirm}>
                {confirmLabel}
            </Button>
            {onCancel && (
                <Button variant="outline-primary" onClick={onCancel}>
                    {cancelLabel}
                </Button>
            )}
        </Modal.Footer>
    </Modal>
);

type Props = {
    title: string;
    isVisible: boolean;
    onCancel?: () => void;
    onConfirm: () => void;
    onOptional?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    optionalLabel?: string;
};

ConfirmationDialog.propTypes = {
    title: string.isRequired,
    isVisible: bool.isRequired,
    onConfirm: func.isRequired,
    onCancel: func,
    onOptional: func,
    confirmLabel: string,
    cancelLabel: string,
    optionalLabel: string,
};

export default ConfirmationDialog;
