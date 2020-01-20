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

import { DTM_PHY_STRING } from 'nrf-dtm-js/src/DTM.js';
import PropTypes from 'prop-types';
import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';

import { fromPCA } from '../utils/boards';

const phyTypeView = (boardType, phy, onPhyUpdated, isRunning) => {
    const compatibility = fromPCA(boardType);
    const items = Object.keys(compatibility.phy).map(keyname => (
        <Dropdown.Item
            key={keyname}
            eventKey={keyname}
            onSelect={evt => onPhyUpdated(compatibility.phy[evt])}
        >
            {DTM_PHY_STRING[compatibility.phy[keyname]]}
        </Dropdown.Item>
    ));
    return (
        <Form.Group controlId="formTimeoutSelect">
            <Form.Label>
                Physical layer
            </Form.Label>
            <DropdownButton
                variant="light"
                title={DTM_PHY_STRING[phy]}
                id="dropdown-variants-phy-type"
                disabled={isRunning}
            >
                {items}
            </DropdownButton>
        </Form.Group>
    );
};

const OtherSettingsView = ({
    boardType,
    phy,
    onPhyUpdated,
    isRunning,
}) => (
    <div
        className="app-sidepanel-panel"
    >
        <div className="app-sidepanel-component-inputbox">
            {phyTypeView(boardType, phy, onPhyUpdated, isRunning)}
        </div>
    </div>
);

OtherSettingsView.propTypes = {
    boardType: PropTypes.string,
    phy: PropTypes.number.isRequired,
    onPhyUpdated: PropTypes.func.isRequired,
    isRunning: PropTypes.bool.isRequired,
};

OtherSettingsView.defaultProps = {
    boardType: '',
};

export default OtherSettingsView;
