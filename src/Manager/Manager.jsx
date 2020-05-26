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

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

import FirstInstallDialog from '../FirstInstall/FirstInstallDialog';

import Environment from './Environment/Environment';
import RemoveEnvironmentDialog from './Environment/RemoveEnvironmentDialog';
import initEnvironments from './initEnvironments';
import OtherPlatformInstructions from './OtherPlatformInstructions';
import { environmentsByVersion, isMasterVisible } from './managerReducer';


const Environments = () => {
    const masterVisible = useSelector(isMasterVisible);
    const environments = useSelector(environmentsByVersion)
        .filter(({ version, isInstalled }) => (
            version === 'master'
                ? isInstalled || masterVisible
                : true
        ));

    if (environments.length === 0) {
        return (
            <Alert variant="info" className="p-4 text-center">
                There are no environments available for installation.
            </Alert>
        );
    }

    return (
        <div>
            {environments.map(environment => (
                <Environment key={environment.version} environment={environment} />
            ))}
        </div>
    );
};

export default props => {
    const dispatch = useDispatch();
    useEffect(() => initEnvironments(dispatch), [dispatch]);

    const isSupportedPlatform = process.platform !== 'linux';
    if (!isSupportedPlatform) {
        return (
            <div {...props}>
                <OtherPlatformInstructions />
            </div>
        );
    }

    return (
        <div {...props}>
            <ButtonToolbar hidden>
                <Button className="mdi mdi-briefcase-plus-outline">
                        Install package
                </Button>
            </ButtonToolbar>
            <Environments />
            <FirstInstallDialog />
            <RemoveEnvironmentDialog />
        </div>
    );
};
