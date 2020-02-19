/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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

import React from 'react';
import { string } from 'prop-types';
import { useSelector } from 'react-redux';
import { resolve, sep } from 'path';
import os from 'os';

import NrfCard from '../NrfCard/NrfCard';

const FirstInstallInstructions = ({ className, ...props }) => {
    const { installDir, selectedVersion } = useSelector(({ app }) => app.settings);
    const version = selectedVersion || '<version>';
    const zephyrDir = `${installDir}${sep}${version}${sep}zephyr`;
    const sampleDir = `${zephyrDir}${sep}samples${sep}basic`;

    const homeDir = os.homedir();

    const suggestedExample = 'blinky';
    const suggestExampleCmakelists = resolve(
        homeDir,
        suggestedExample,
        'CMakeLists.txt',
    );

    const exampleBoardDir = resolve(
        zephyrDir,
        'boards',
        'arm',
        'nrf9160_pca10090',
    );

    return (
        <NrfCard className={`${className} selectable`} {...props}>
            <p>
                Steps to compile a first sample project with nRF Connect SDK
                (NCS), once the installation of the tools and the NCS is
                finished:
            </p>
            <ol>
                <li>
                    Go to <code>{sampleDir}</code> and copy one of the folders
                    (we suggest the classic <code>{suggestedExample}</code>) to
                    a folder of your liking, e.g. <code>{homeDir}</code>.
                </li>
                <li>
                    Launch SEGGER Embedded Studio (SES) by clicking on{' '}
                    <q>Open IDE</q> here in the list of SDK environments.
                </li>
                <li>
                    SES is a big IDE and can be intimidating for a first time
                    user. But do not worry, we will guide you through compiling
                    a first sample project with NCS:
                    <ol>
                        <li>
                            Select{' '}
                            <code>File→Open nRF Connect SDK Project…</code>
                        </li>
                        <li>
                            Select two things:
                            <ol>
                                <li>
                                    As <code>CMakeLists.txt</code>, select the
                                    one from the sample project you just copied,
                                    e.g <code>{suggestExampleCmakelists}</code>
                                </li>
                                <li>
                                    For <code>Board Directory</code> select one
                                    matching your hardware from the NSC folder
                                    that was just cloned, e.g. if you have a
                                    nRF9160-DK (PCA10090), then select{' '}
                                    <code>{exampleBoardDir}</code>
                                </li>
                                <li>
                                    For the other settings (
                                    <code>Board Name</code>,{' '}
                                    <code>Build Directory</code>,{' '}
                                    <code>Clean Build Directory</code>) you can
                                    usually go with the defaults on the first
                                    project.
                                </li>
                                <li>
                                    After clicking on OK, you have to wait a few
                                    seconds without a visual feedback. SES is
                                    just working in the background for a moment.
                                </li>
                            </ol>
                        </li>
                        <li>
                            You now have the project set up. Compile it with
                            Build→Build solution (Shift-F7).
                        </li>
                        <li>
                            Attach your device and program it with
                            Target→Download zephyr/zephyr.elf.
                        </li>
                        <li>
                            Now your device should be programmed and you should
                            see the LED blink happily on it.{' '}
                            <span role="img" aria-label="Party!">
                                🎉
                            </span>
                        </li>
                        <li>
                            If you are looking for the <code>main.c</code> to
                            modify it to your likings: You find it on the left
                            in the <code>Project Explorer</code> in{' '}
                            <code>
                                Solution &#39;build&#39;→Project
                                &#39;app/libapp.a&#39;→C_COMPILER__app
                            </code>
                            .
                        </li>
                    </ol>
                </li>
            </ol>
            <p>
                You can see these instruction again later, by selecting{' '}
                <q>First steps with NCS</q> from the drop down next to you
                installed NCS in the SDK environments.
            </p>
            <p>
                There are more elaborate{' '}
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/gs_programming.html"
                >
                    online instructions how to build a sample application with
                    nRF Connect SDK and SEGGER Embedded Studio
                </a>{' '}
                that might be especially helpful if you are running into
                trouble.
            </p>
            <p>
                You may also like to read the{' '}
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/user_guides.html"
                >
                    online user guides in the NCS documentation
                </a>{' '}
                for more in-depth looks into several aspects.
            </p>
        </NrfCard>
    );
};

FirstInstallInstructions.propTypes = {
    className: string.isRequired,
};

export default FirstInstallInstructions;
