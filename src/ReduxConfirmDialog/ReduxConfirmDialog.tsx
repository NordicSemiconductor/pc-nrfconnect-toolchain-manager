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
        hideCancel,
        cancelLabel,
        onOptional,
        optionalLabel,
    } = useSelector(reduxConfirmDialogSelector);

    const cancelProps = hideCancel
        ? {}
        : {
              cancelLabel,
              onCancel: () => {
                  dispatch(hideReduxConfirmDialogAction());
                  callback ? callback(true) : undefined;
              },
          };

    const confirmProps = {
        confirmLabel,
        onConfirm: () => {
            dispatch(hideReduxConfirmDialogAction());
            callback ? callback(false) : undefined;
        },
    };

    const optionalProps = onOptional
        ? {
              optionalLabel,
              onOptional: () => {
                  dispatch(hideReduxConfirmDialogAction());
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TypeScript does not conclude correctly that we already checked that onOptional is not undefined here
                  onOptional!(false);
              },
          }
        : {};

    return (
        <ConfirmationDialog
            isVisible={!!callback}
            title={title ?? ''}
            {...confirmProps}
            {...cancelProps}
            {...optionalProps}
        >
            <ReactMarkdown>{content}</ReactMarkdown>
        </ConfirmationDialog>
    );
};
