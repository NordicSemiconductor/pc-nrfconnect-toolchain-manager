/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';

import {
    hideNrfUtilDialogAction,
    nrfUtilDialogSelector,
} from './nrfUtilDialogSlice';

const NrfUtilDialog: FC = () => {
    const { isVisible, content, title } = useSelector(nrfUtilDialogSelector);

    return (
        <Modal show={isVisible} onHide={hideNrfUtilDialogAction} backdrop>
            <Modal.Header closeButton={false}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ReactMarkdown>{content}</ReactMarkdown>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="outline-primary"
                    onClick={hideNrfUtilDialogAction}
                >
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default NrfUtilDialog;
