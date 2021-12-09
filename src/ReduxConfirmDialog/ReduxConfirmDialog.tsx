/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog';
import {
    hideReduxConfirmDialogAction,
    reduxConfirmDialogSelector,
} from './reduxConfirmDialogSlice';

export default () => {
    const dispatch = useDispatch();
    const {
        title,
        content,
        callback,
        confirmLabel,
        cancelLabel,
        onOptional,
        optionalLabel,
    } = useSelector(reduxConfirmDialogSelector);

    return (
        <ConfirmationDialog
            isVisible={!!callback}
            title={title ?? ''}
            onCancel={() => {
                dispatch(hideReduxConfirmDialogAction());
                callback ? callback(true) : undefined;
            }}
            onConfirm={() => {
                dispatch(hideReduxConfirmDialogAction());
                callback ? callback(false) : undefined;
            }}
            confirmLabel={confirmLabel}
            cancelLabel={cancelLabel}
            onOptional={
                onOptional
                    ? () => {
                          dispatch(hideReduxConfirmDialogAction());
                          onOptional(false);
                      }
                    : undefined
            }
            optionalLabel={optionalLabel}
        >
            <ReactMarkdown>{content}</ReactMarkdown>
        </ConfirmationDialog>
    );
};
