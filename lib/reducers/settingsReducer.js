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

import { Record } from 'immutable';
import { DTM } from 'nrf-dtm-js/src/DTM.js';
import * as SettingsActions from '../actions/settingsActions';
import * as Constants from '../utils/constants';

const InitialState = new Record({
    testMode: SettingsActions.DTM_TEST_MODE_BUTTON.transmitter,
    channelMode: SettingsActions.DTM_CHANNEL_MODE.single,
    singleChannel: 19,
    lowChannel: 11,
    highChannel: 26,
    sweepTime: 30,
    bitpattern: 0,
    length: 10,
    txPower: Math.max(0, Constants.dbmValues.indexOf(0)),
    phy: DTM.DTM_PARAMETER.PHY_LE_1M,
    modulationMode: DTM.DTM_PARAMETER.STANDARD_MODULATION_INDEX,
    timeout: 0,
});

export default function target(state = new InitialState(), action) {
    switch (action.type) {
        case SettingsActions.DTM_TEST_MODE_CHANGED_ACTION:
            return state
                .set('testMode', action.buttonClicked);

        case SettingsActions.DTM_CHANNEL_MODE_CHANGED_ACTION:
            return state
                .set('channelMode', action.buttonClicked);

        case SettingsActions.DTM_CHANNEL_CHANGED_ACTION.SINGLE:
            return state
                .set('singleChannel', action.channel);

        case SettingsActions.DTM_CHANNEL_CHANGED_ACTION.LOW:
            return state
                .set('lowChannel', action.channel);

        case SettingsActions.DTM_CHANNEL_CHANGED_ACTION.HIGH:
            return state
                .set('highChannel', action.channel);

        case SettingsActions.SWEEP_TIME_CHANGED_ACTION:
            return state
                .set('sweepTime', action.time);

        case SettingsActions.TX_POWER_CHANGED_ACTION:
            return state
                .set('txPower', action.value);

        case SettingsActions.BITPATTERN_CHANGED_ACTION:
            return state
                .set('bitpattern', action.value);

        case SettingsActions.LENGTH_CHANGED_ACTION:
            return state
                .set('length', action.value);

        case SettingsActions.TIMEOUT_CHANGED_ACTION:
            return state
                .set('timeout', action.time);

        case SettingsActions.PHY_CHANGED_ACTION:
            return state
                .set('phy', action.value);

        case SettingsActions.MODULATION_CHANGED_ACTION:
            return state
                .set('modulationMode', action.value);

        default:
    }
    return state;
}
