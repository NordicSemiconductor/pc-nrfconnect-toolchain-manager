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
import React from 'react';
import { Bar } from 'react-chartjs-2';

import { DTM_TEST_MODE_BUTTON } from '../actions/settingsActions';
import { dbmValues, channelTotal, bleChannels } from '../utils/constants';

const frequencyBase = 2402;
const frequencyInterval = 2;

const chartColors = {
    inactive: 'rgba(255,99,132,0.2)',
    active: 'rgba(110,205,172,0.5)',
};

const chartDataTransmit = (currentChannel, txPower) => {
    const active = Array.from(Array(channelTotal), () => 0);
    if (currentChannel !== undefined) {
        active[currentChannel] = txPower;
    }

    const datasets = [{
        label: 'Active transmission power',
        data: active,
        backgroundColor: chartColors.active,
        borderColor: chartColors.active,
        borderWidth: 1,
        hoverBackgroundColor: chartColors.active,
        hoverBorderColor: chartColors.active,
    }];

    const bleChannelsUpdated = bleChannels.map(
        (channel, index) => `${channel} | ${frequencyBase + index * frequencyInterval} MHz`,
    );

    return {
        labels: bleChannelsUpdated,
        datasets,
    };
};

const chartDataReceive = history => {
    const datasets = [];
    if (history !== undefined) {
        datasets.push({
            label: 'Received packets',
            data: history,
            backgroundColor: chartColors.active,
            borderColor: chartColors.active,
            borderWidth: 1,
            hoverBackgroundColor: chartColors.active,
            hoverBorderColor: chartColors.active,
        });
    }

    const bleChannelsUpdated = bleChannels.map(
        (channel, index) => `${channel} | ${frequencyBase + index * frequencyInterval} MHz`,
    );

    return {
        labels: bleChannelsUpdated,
        datasets,
    };
};

const getOptions = selectedTestMode => {
    const options = {
        scaleShowGridLines: true,
        scaleGridLineColor: 'rgba(10,100,100,.05)',
        scaleGridLineWidth: 1,
        scaleShowHorizontalLines: true,
        scaleShowVerticalLines: true,
        bezierCurve: true,
        bezierCurveTension: 0.4,
        pointDot: true,
        pointDotRadius: 4,
        pointDotStrokeWidth: 1,
        pointHitDetectionRadius: 20,
        datasetStroke: true,
        datasetStrokeWidth: 2,
        datasetFill: true,
        maintainAspectRatio: false,
    };

    if (selectedTestMode === DTM_TEST_MODE_BUTTON.transmitter) {
        options.animation = false;
        options.scales = {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0,
                    max: 13,
                    suggestedMin: undefined,
                    suggestedMax: undefined,
                    stepSize: 1,
                    callback: value => `${dbmValues[value]} dbm`,
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Strength (dbm)',
                },
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Channel | Frequency',
                },
            }],
        };
    } else {
        options.animation = null;
        options.scales = {
            yAxes: [{
                ticks: {
                    min: undefined,
                    max: undefined,
                    suggestedMin: 0,
                    suggestedMax: 10,
                    stepSize: undefined,
                    callback: value => value,
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Received packets',
                },
            }],

            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Channel | Frequency',
                },
            }],
        };
    }
    return options;
};

let receiveValueHistory = new Array(channelTotal).fill(0);
const receiveValueHistoryTicks = new Array(channelTotal).fill(0);

const ChartView = ({
    selectedTestMode,
    currentChannel,
    lastChannel,
    lastReceived,
    isRunning,
    txPower,
}) => {
    receiveValueHistory = [...receiveValueHistory];
    const activationColors = new Array(channelTotal).fill('#000000');
    receiveValueHistoryTicks.forEach((value, idx) => {
        if (value > 60) {
            receiveValueHistory[idx] = 0;
        }
        if (value < 10) {
            activationColors[idx] = '#90ef00';
        } else if (value < 25) {
            activationColors[idx] = '#be3000';
        } else {
            activationColors[idx] = '#ef3000';
        }
        receiveValueHistoryTicks[idx] += 1;
    });

    if (lastChannel.channel !== undefined) {
        receiveValueHistory[lastChannel.channel] = lastChannel.received;
        receiveValueHistoryTicks[lastChannel.channel] = 0;
    }


    const currentChannelData = new Array(channelTotal).fill(0);
    if (currentChannel !== undefined) {
        currentChannelData[currentChannel] = Math.max(1, Math.max(...receiveValueHistory));
    }

    const receivedChannelData = new Array(channelTotal).fill(0);
    if (lastChannel.channel !== undefined) {
        receivedChannelData[lastChannel.channel] = lastChannel.received;
    }

    if (!isRunning) {
        return (
            <Bar
                data={(selectedTestMode === DTM_TEST_MODE_BUTTON.transmitter
                    && chartDataTransmit(undefined, txPower))
                || (selectedTestMode === DTM_TEST_MODE_BUTTON.receiver
                    && chartDataReceive(lastReceived))}
                options={getOptions(selectedTestMode)}
                width={600}
                height={250}
            />
        );
    }

    return (
        <Bar
            data={(selectedTestMode === DTM_TEST_MODE_BUTTON.transmitter
                && chartDataTransmit(currentChannel, txPower))
                || (selectedTestMode === DTM_TEST_MODE_BUTTON.receiver
                    && chartDataReceive(lastReceived))}
            options={getOptions(selectedTestMode)}
            width={600}
            height={250}
        />
    );
};

ChartView.propTypes = {
    lastChannel: PropTypes.objectOf(PropTypes.number).isRequired,
    lastReceived: PropTypes.arrayOf(PropTypes.number).isRequired,
    isRunning: PropTypes.bool.isRequired,
    currentChannel: PropTypes.number,
    selectedTestMode: PropTypes.number.isRequired,
    txPower: PropTypes.number.isRequired,
};

ChartView.defaultProps = {
    currentChannel: 0,
};

export default ChartView;
