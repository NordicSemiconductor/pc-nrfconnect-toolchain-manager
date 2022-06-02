/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import BootstrapButton, {
    ButtonProps as BootstrapProps,
} from 'react-bootstrap/Button';

import './style.scss';

export type ButtonProps = {
    icon: string;
    label: string;
    title?: string;
    onClick?: () => void;
} & BootstrapProps;

const Button = ({ icon, label, ...props }: ButtonProps) => (
    <BootstrapButton
        className={`mdi ${icon} toolchain-item-button ml-2`}
        {...props}
    >
        {label}
    </BootstrapButton>
);

export default Button;
