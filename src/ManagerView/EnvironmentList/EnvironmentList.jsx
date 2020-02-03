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

import EnvironmentItem from '../EnvironmentItem';

const EnvironmentList = ({
    environmentList,
    cloneNcs,
    install,
    isInProcess,
    openBash,
    openFolder,
    openToolchainFolder,
    openSes,
    removeEnvironment,
    removeToolchain,
}) => environmentList.map(environment => (
    <EnvironmentItem
        key={environment.version}
        environment={environment}
        cloneNcs={() => cloneNcs(environment.version)}
        install={() => install(environment.version)}
        isInProcess={isInProcess}
        open={() => openSes(environment.version)}
        openBash={() => openBash(environment.version)}
        openFolder={() => openFolder(environment.version)}
        openToolchainFolder={() => openToolchainFolder(environment.version)}
        removeEnvironment={() => removeEnvironment(environment.version)}
        removeToolchain={() => removeToolchain(environment.version)}
    />
));

EnvironmentList.propTypes = {
    environmentList: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    cloneNcs: PropTypes.func.isRequired,
    install: PropTypes.func.isRequired,
    isInProcess: PropTypes.bool.isRequired,
    openBash: PropTypes.func.isRequired,
    openFolder: PropTypes.func.isRequired,
    openToolchainFolder: PropTypes.func.isRequired,
    openSes: PropTypes.func.isRequired,
    removeEnvironment: PropTypes.func.isRequired,
    removeToolchain: PropTypes.func.isRequired,
};

export default EnvironmentList;
