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

import React, { useEffect, useState } from 'react';
import { string } from 'prop-types';
import { execSync } from 'child_process';
import Alert from 'react-bootstrap/Alert';

const isLinux = process.platform === 'linux';
const isWindows = process.platform === 'win32';

export const OnlineDocs = ({ label }) => (
    <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/gs_installing.html"
    >
        {label}
    </a>
);

OnlineDocs.propTypes = {
    label: string.isRequired,
};

export default () => {
    if (isWindows) return null;

    const [isSnapAvailable, setSnapAvailable] = useState(true);

    useEffect(() => {
        try {
            execSync('which snap');
        } catch (err) {
            setSnapAvailable(false);
        }
    }, []);

    return (
        <>
            <Alert variant="warning">
                <b>Support for {isLinux ? 'Linux' : 'macOS'} is experimental.</b>
                {' '}For instructions on how to manually set up an environment on your machine,
                please read the online <OnlineDocs label="documentation" />.
            </Alert>
            {isSnapAvailable || (
                <Alert variant="danger">
                    Linux support depends on <b>snap</b> which seems unavailable,
                    please install the package.
                </Alert>
            )}
        </>
    );
};
