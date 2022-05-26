/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { FC } from 'react';
import Card from 'react-bootstrap/Card';

import './nrfCard.scss';

const NrfCard: FC = ({ children }) => (
    <Card body className="nrf-card">
        {children}
    </Card>
);

export default NrfCard;
