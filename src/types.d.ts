/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

declare module '!!@svgr/webpack!*.svg' {
    const svg: React.ElementType;
    export default svg;
}

declare module '*.svg' {
    const url: string;
    export default url;
}

declare module '*.png' {
    const url: string;
    export default url;
}

declare module '*.module.scss' {
    const properties: {
        [property: string]: string;
    };
    export = properties;
}
