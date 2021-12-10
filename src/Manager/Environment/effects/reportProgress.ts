/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { Dispatch, RootState } from '../../../state';
import { getEnvironment } from '../../managerSlice';
import { progress, setProgress } from '../environmentReducer';

export const DOWNLOAD = 0;
export const UNPACK = 50;

export const reportProgress =
    (version: string, currentValue: number, maxValue: number, half: number) =>
    (dispatch: Dispatch, getState: () => RootState) => {
        const prevProgress = progress(getEnvironment(getState(), version));
        const newProgress = Math.min(
            100,
            Math.round((currentValue / maxValue) * 50) + half
        );

        if (newProgress !== prevProgress) {
            const stage = half === DOWNLOAD ? 'Downloading' : 'Installing';
            dispatch(setProgress(version, stage, newProgress));
        }
    };
