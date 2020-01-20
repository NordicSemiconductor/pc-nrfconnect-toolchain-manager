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

/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */

import 'react-rangeslider/lib/index.css';

import PropTypes from 'prop-types';
import React from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import Slider from 'react-rangeslider';

import { fromPCA } from '../utils/boards';

const txPowerView = (boardType, txPowerIdx, txPowerUpdated, isRunning) => {
    const compatibility = fromPCA(boardType);
    const maxDbmRangeValue = compatibility.txPower.length - 1;

    const label = {};
    label[0] = `${compatibility.txPower[0]}`;
    label[maxDbmRangeValue] = `${compatibility.txPower[maxDbmRangeValue]}`;
    return (
        <div className="app-sidepanel-component-slider">
            <FormLabel>
                {`TX Power [${compatibility.txPower[txPowerIdx]} dBm]`}
            </FormLabel>
            <Slider
                value={txPowerIdx}
                onChange={value => {
                    if (!isRunning) {
                        return txPowerUpdated(value);
                    }
                    return txPowerUpdated(txPowerIdx);
                }
                }
                max={maxDbmRangeValue}
                min={0}
                labels={label}
                disabled={isRunning}
                format={i => `${compatibility.txPower[i]} dBm`}
            />
        </div>
    );
};

const TransmitSetupView = ({
    txPowerUpdated,
    txPowerIdx,
    boardType,
    isRunning,
}) => (
    <div className="app-sidepanel-panel">
        {txPowerView(boardType, txPowerIdx, txPowerUpdated, isRunning)}
    </div>
);

TransmitSetupView.propTypes = {
    txPowerUpdated: PropTypes.func.isRequired,
    txPowerIdx: PropTypes.number.isRequired,
    boardType: PropTypes.string,
    isRunning: PropTypes.bool.isRequired,
};

TransmitSetupView.defaultProps = {
    boardType: '',
};

export default TransmitSetupView;
