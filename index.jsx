/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable no-param-reassign */

import './resources/css/index.scss';

import path from 'path';

import {
    getAppDir,
    logger,
    startWatchingDevices,
    stopWatchingDevices,
} from 'nrfconnect/core';
import React from 'react';
import serialport from 'serialport';

import { deselectDevice, selectDevice } from './lib/actions/testActions';
import {
    clearAllWarnings,
} from './lib/actions/warningActions';
import AppMainView from './lib/containers/appMainView';
import AppSidePanelView from './lib/containers/appSidePanelView';
import appReducer from './lib/reducers';
import { compatiblePCAs } from './lib/utils/constants';

export default {
    config: {
        selectorTraits: {
            serialport: true,
            jlink: true,
        },
        deviceSetup: {
            jprog: {
                pca10040: {
                    fw: path.resolve(getAppDir(), 'firmware/direct_test_mode_pca10040.hex'),
                    fwVersion: 'dtm-fw-1.0.0',
                    fwIdAddress: 0x6000,
                },
                pca10056: {
                    fw: path.resolve(getAppDir(), 'firmware/direct_test_mode_pca10056.hex'),
                    fwVersion: 'dtm-fw-1.0.0',
                    fwIdAddress: 0x6000,
                },
            },
        },
    },

    decorateMainView: MainView => () => (
        <MainView cssClass="main-view">
            <AppMainView />
        </MainView>
    ),

    decorateSidePanel: SidePanel => () => (
        <SidePanel>
            <AppSidePanelView cssClass="side-panel" />
        </SidePanel>
    ),

    mapDeviceSelectorState: (state, props) => ({
        portIndicatorStatus: (state.app.device.serialNumber !== null) ? 'on' : 'off',
        ...props,
    }),

    reduceApp: appReducer,

    middleware: store => next => async action => {
        const { dispatch } = store;
        const { type, device } = action;
        const getPortComOne = serialport.list()
            .then(ports => ports.find(p => p.comName === 'COM1'));

        switch (type) {
            case 'DEVICES_DETECTED': {
                const { devices } = action;
                const port = await getPortComOne;
                if (port) {
                    action.devices = [
                        {
                            boardVersion: undefined,
                            serialNumber: 'COM1',
                            serialport: port,
                            traits: ['serialport'],
                        },
                        ...devices,
                    ];
                }
                break;
            }

            case 'DEVICE_SELECTED': {
                const { serialNumber, boardVersion } = device;
                dispatch(clearAllWarnings());
                if (compatiblePCAs.includes(boardVersion)) {
                    logger.info(`Validating firmware for device with s/n ${serialNumber}`);
                }
                break;
            }

            case 'DEVICE_SETUP_INPUT_REQUIRED': {
                action.message = 'In order to use this application you need a firmware '
                    + 'that supports Direct Test Mode. '
                    + 'You may use the provided pre-compiled firmware or your own. '
                    + 'Would you like to program the pre-compiled firmware to the device?';
                break;
            }

            case 'DEVICE_SETUP_COMPLETE': {
                const { serialport: port, boardVersion } = device;
                logger.info('Device selected successfully');
                dispatch(stopWatchingDevices());
                dispatch(selectDevice(port.comName, boardVersion));
                break;
            }

            case 'DEVICE_DESELECTED':
                dispatch(deselectDevice());
                dispatch(startWatchingDevices());
                dispatch(clearAllWarnings());
                break;

            default:
        }

        next(action);
    },
};
