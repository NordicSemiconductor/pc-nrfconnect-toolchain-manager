/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Card from 'react-bootstrap/Card';
import { arrayOf, node } from 'prop-types';

import './nrfCard.scss';

const NrfCard: FC = ({ children }) => (
    <Card body className="nrf-card">
        {children}
    </Card>
);

NrfCard.propTypes = {
    children: arrayOf(node).isRequired,
};

export default NrfCard;
