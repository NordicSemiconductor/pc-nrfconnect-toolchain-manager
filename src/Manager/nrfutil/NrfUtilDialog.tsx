/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ReactMarkdown from 'react-markdown';
import { useDispatch, useSelector } from 'react-redux';

import {
    hideNrfUtilDialogAction,
    nrfUtilDialogSelector,
} from './nrfUtilDialogSlice';

const overWriteA = ({
    href,
    children,
}: {
    href?: string;
    children?: React.ReactNode;
}) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
    </a>
);

const NrfUtilDialog: FC = () => {
    const dispatch = useDispatch();
    const { isVisible, content, title } = useSelector(nrfUtilDialogSelector);

    const close = () => dispatch(hideNrfUtilDialogAction());

    return (
        <Modal show={isVisible} onHide={close} backdrop>
            <Modal.Header closeButton={false}>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ReactMarkdown
                    components={{
                        a: overWriteA,
                    }}
                >
                    {content ?? ''}
                </ReactMarkdown>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-primary" onClick={close}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default NrfUtilDialog;
