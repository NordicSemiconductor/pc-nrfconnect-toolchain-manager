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
export const DTM_TEST_MODE_CHANGED_ACTION = 'DTM_TEST_MODE_CHANGED_ACTION';
export const DTM_CHANNEL_MODE_CHANGED_ACTION = 'DTM_CHANNEL_MODE_CHANGED_ACTION';

export const DTM_CHANNEL_CHANGED_ACTION = {
    SINGLE: 'DTM_SINGLE_CHANNEL_CHANGED_ACTION',
    LOW: 'DTM_LOW_CHANNEL_CHANGED_ACTION',
    HIGH: 'DTM_HIGH_CHANNEL_CHANGED_ACTION',
};

export const SWEEP_TIME_CHANGED_ACTION = 'SWEEP_TIME_CHANGED_ACTION';
export const TIMEOUT_CHANGED_ACTION = 'TIMEOUT_CHANGED_ACTION';

export const TX_POWER_CHANGED_ACTION = 'TX_POWER_CHANGED_ACTION';
export const BITPATTERN_CHANGED_ACTION = 'BITPATTERN_CHANGED_ACTION';
export const LENGTH_CHANGED_ACTION = 'LENGTH_CHANGED_ACTION';
export const PHY_CHANGED_ACTION = 'PHY_CHANGED_ACTION';
export const MODULATION_CHANGED_ACTION = 'MODULATION_CHANGED_ACTION';

export const DTM_TEST_MODE_BUTTON = {
    transmitter: 0,
    receiver: 1,
};

export const DTM_CHANNEL_MODE = {
    single: 'DTM_CHANNEL_MODE_SINGLE_ACTION',
    sweep: 'DTM_CHANNEL_MODE_SWEEP_ACTION',
};

export function testModeChanged(buttonClicked) {
    return dispatch => {
        dispatch({
            type: DTM_TEST_MODE_CHANGED_ACTION,
            buttonClicked,
        });
    };
}

export function channelModeChanged(buttonClicked) {
    return dispatch => {
        dispatch({
            type: DTM_CHANNEL_MODE_CHANGED_ACTION,
            buttonClicked,
        });
    };
}

export function singleChannelChanged(channel) {
    return dispatch => {
        dispatch({
            type: DTM_CHANNEL_CHANGED_ACTION.SINGLE,
            channel,
        });
    };
}

export function lowChannelChanged(channel) {
    return dispatch => {
        dispatch({
            type: DTM_CHANNEL_CHANGED_ACTION.LOW,
            channel,
        });
    };
}

export function highChannelChanged(channel) {
    return dispatch => {
        dispatch({
            type: DTM_CHANNEL_CHANGED_ACTION.HIGH,
            channel,
        });
    };
}

export function sweepTimeChanged(time) {
    return dispatch => {
        dispatch({
            type: SWEEP_TIME_CHANGED_ACTION,
            time,
        });
    };
}

export function txPowerUpdated(value) {
    return dispatch => {
        dispatch({
            type: TX_POWER_CHANGED_ACTION,
            value,
        });
    };
}

export function bitpatternUpdated(value) {
    return dispatch => {
        dispatch({
            type: BITPATTERN_CHANGED_ACTION,
            value,
        });
    };
}

export function lengthUpdated(value) {
    return dispatch => {
        dispatch({
            type: LENGTH_CHANGED_ACTION,
            value,
        });
    };
}

export function timeoutChanged(time) {
    return dispatch => {
        dispatch({
            type: TIMEOUT_CHANGED_ACTION,
            time,
        });
    };
}

export function phyChanged(value) {
    return dispatch => {
        dispatch({
            type: PHY_CHANGED_ACTION,
            value,
        });
    };
}

export function modulationChanged(value) {
    return dispatch => {
        dispatch({
            type: MODULATION_CHANGED_ACTION,
            value,
        });
    };
}
