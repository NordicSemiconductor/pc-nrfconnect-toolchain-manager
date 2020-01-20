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
import * as TestActions from '../actions/testActions';

const InitialState = new Record({
    isRunning: false,
    lastStatusMessage: '',
    lastReceived: new Array(40).fill(0),
    currentChannel: undefined,
    lastChannel: { channel: 0, received: 0 },
    update: 0,
});

export default function target(state = new InitialState(), action) {
    switch (action.type) {
        case TestActions.DTM_TEST_STARTED_ACTION:
            return state
                .set('isRunning', true)
                .set('lastStatusMessage', 'Running test')
                .set('lastReceived', new Array(40).fill(0))
                .set('update', state.update + 1);
        case TestActions.DTM_TEST_STOPPED_ACTION:
            return state
                .set('isRunning', false)
                .set('update', state.update + 1);
        case TestActions.DTM_TEST_ENDED_SUCCESSFULLY_ACTION:
            return state
                .set('lastReceived', action.received)
                .set('lastStatusMessage', 'Test ended successfully')
                .set('update', state.update + 1);
        case TestActions.DTM_TEST_ENDED_FAILURE_ACTION:
            return state
                .set('lastStatusMessage', action.message)
                .set('update', state.update + 1);
        case TestActions.DTM_CHANNEL_START:
            return state
                .set('currentChannel', action.channel)
                .set('update', state.update + 1);
        case TestActions.DTM_CHANNEL_RESET:
            return state
                .set('currentChannel', undefined)
                .set('update', state.update + 1);
        case TestActions.DTM_CHANNEL_END: {
            const { channel, received } = action;
            const packets = received === undefined ? 0 : received;
            const nextReceivedCount = [...state.lastReceived];
            nextReceivedCount[channel] += packets;
            return state
                .set('lastChannel', { channel, received: packets })
                .set('lastReceived', nextReceivedCount)
                .set('update', state.update + 1);
        }

        default:
    }
    return state;
}
