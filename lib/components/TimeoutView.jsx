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

import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';

const TimeoutSetupView = ({
    timeout,
    onTimeoutChanged,
    isRunning,
}) => {
    const [enableTimeout, setEnableTimeout] = useState(timeout !== 0);
    const [timeoutValue, setTimeoutValue] = useState(timeout === 0 ? 1000 : timeout);

    const toggleTimeout = () => {
        if (enableTimeout) {
            onTimeoutChanged(0);
        } else {
            onTimeoutChanged(timeoutValue);
        }
        setEnableTimeout(!enableTimeout);
    };

    const updateTimeout = time => {
        onTimeoutChanged(time);
        setTimeoutValue(time);
    };

    return (
        <div className="app-sidepanel-panel">
            <Form.Group controlId="timeoutEnableCheckbox">
                <Form.Check
                    defaultChecked={enableTimeout}
                    onClick={() => toggleTimeout()}
                    disabled={isRunning}
                    label="Enable"
                />
            </Form.Group>
            <Form.Group controlId="formTimeoutSelect">
                <Form.Label>Timeout (ms)</Form.Label>
                <Form.Control
                    onChange={evt => updateTimeout(evt.target.value)}
                    componentclass="input"
                    value={timeoutValue}
                    min={20}
                    step={10}
                    type="number"
                    size="sm"
                    disabled={!enableTimeout || isRunning}
                />
            </Form.Group>
        </div>
    );
};

TimeoutSetupView.propTypes = {
    timeout: PropTypes.number.isRequired,
    onTimeoutChanged: PropTypes.func.isRequired,
    isRunning: PropTypes.bool.isRequired,

};
export default TimeoutSetupView;
