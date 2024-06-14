/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useDispatch, useSelector } from 'react-redux';
import {
    classNames,
    DialogButton,
    GenericDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import {
    hideReduxConfirmDialogAction,
    reduxConfirmDialogSelector,
} from './reduxConfirmDialogSlice';

import styles from './reduxConfirmDialog.module.scss';

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
        hasSelectableContent,
    } = useSelector(reduxConfirmDialogSelector);

    const cancelProps = hideCancel
        ? undefined
        : {
              cancelLabel,
              onCancel: () => {
                  dispatch(hideReduxConfirmDialogAction());
                  callback ? callback(true) : undefined;
              },
          };

    const confirmProps = {
        confirmLabel: confirmLabel ?? 'OK',
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
        : undefined;

    return (
        <GenericDialog
            footer={
                <>
                    <DialogButton
                        variant="primary"
                        onClick={confirmProps.onConfirm}
                    >
                        {confirmProps.confirmLabel}
                    </DialogButton>
                    {optionalProps && (
                        <DialogButton onClick={optionalProps.onOptional}>
                            {optionalProps.optionalLabel}
                        </DialogButton>
                    )}
                    {cancelProps && (
                        <DialogButton
                            variant="primary"
                            onClick={cancelProps.onCancel}
                        >
                            {cancelProps.cancelLabel}
                        </DialogButton>
                    )}
                </>
            }
            isVisible={!!callback}
            title={title ?? ''}
        >
            <ReactMarkdown
                className={classNames(
                    hasSelectableContent && styles.selectable
                )}
            >
                {content ?? ''}
            </ReactMarkdown>
        </GenericDialog>
    );
};
