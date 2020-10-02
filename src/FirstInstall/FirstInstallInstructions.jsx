/* Copyright (c) 2015 - 2020, Nordic Semiconductor ASA
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
import { useDispatch, useSelector } from 'react-redux';
import { sep } from 'path';
import os from 'os';

import Alert from 'react-bootstrap/Alert';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

import { hideFirstSteps, selectedVersion } from '../Manager/managerReducer';
import { currentInstallDir } from '../InstallDir/installDirReducer';

const Ie = () => (<>{' '}<i>i.e.</i>{' '}</>);

const FirstInstallInstructions = props => {
    const dispatch = useDispatch();
    const version = useSelector(selectedVersion) || '<version>';
    const installDir = useSelector(currentInstallDir);
    const zephyrDir = [installDir, version, 'zephyr'].join(sep);
    const sampleDir = [zephyrDir, 'samples', 'basic'].join(sep);
    const homeDir = os.homedir();
    const suggestedExample = 'blinky';
    const suggestExampleCmakelists = [sampleDir, suggestedExample, 'CMakeLists.txt'].join(sep);
    const boardName = 'nrf9160_pca10090';
    const suggestExampleBuildDir = [sampleDir, suggestedExample, `build_${boardName}`].join(sep);
    const exampleBoardDir = [zephyrDir, 'boards', 'arm', boardName].join(sep);

    return (
        <div {...props}>
            <ButtonToolbar className="mb-2">
                <Button
                    className="mdi mdi-arrow-left"
                    variant="secondary"
                    onClick={() => dispatch(hideFirstSteps())}
                >
                    Go back
                </Button>
            </ButtonToolbar>
            <div>
                <Card body className="selectable first-install nrf-card">
                    <h4>Building with SEGGER Embedded Studio</h4>
                    <p>
                        Once the installation of the tools and the NCS is finished,
                        complete the following steps to build nRF Connect SDK projects with SES.
                    </p>
                    <ol>
                        <li hidden>
                            Go to <code>{sampleDir}</code> and copy one of the directories
                            (we suggest the classic <code>{suggestedExample}</code>) to
                            a directory of your liking, e.g. <code>{homeDir}</code>.
                        </li>
                        <li>Start SEGGER Embedded Studio by clicking <b>Open IDE</b></li>
                        <li>Select <code>File → Open nRF Connect SDK Project…</code></li>
                        <li>
                            To import a project into SES, you must specify the following
                            information:
                            <ul>
                                <li>
                                    <b>CMakeLists.txt</b> - the location of
                                    the <code>CMakeLists.txt</code> project file of the sample
                                    that you want to work with<br />
                                    <Ie /><code>{suggestExampleCmakelists}</code>
                                </li>
                                <li>
                                    <b>Board Directory</b> - the location of the board description
                                    of the board for which to build the project<br />
                                    <Ie /><code>{exampleBoardDir}</code>
                                </li>
                                <li>
                                    <b>Board Name</b> - the board name (select from the list that
                                    is populated based on the board directory)<br />
                                    <Ie /><code>{boardName}</code>
                                </li>
                                <li>
                                    <b>Build Directory</b> - the directory in which to run the build
                                    (automatically filled based on the board name, but you can
                                    specify a different directory)<br />
                                    <Ie /><code>{suggestExampleBuildDir}</code>
                                </li>
                                <li>
                                    <b>Clean Build Directory</b> - select this option to ensure
                                    that you are not building with an outdated build cache
                                </li>
                            </ul>
                        </li>
                        <li>
                            Click <b>OK</b> to import the project into SES. You can now work with
                            the project in the IDE.
                        </li>
                        <li>
                            <p>Build and program your project.</p>
                            <p>
                                The required steps differ depending on if you build a single
                                application or a multi-image project (such as the nRF9160 samples,
                                which include{' '}
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/samples/nrf9160/spm/README.html#secure-partition-manager"
                                >
                                    SPM
                                </a>).
                            </p>
                            <Alert variant="success">
                                <p>
                                    If you are working with an nRF9160 DK, make sure to select the
                                    correct controller before you program the application to
                                    your board.
                                </p>
                                <p>
                                    Put the <b>SW5</b> switch (marked debug/prog) in
                                    the <b>NRF91</b> position to program the main controller,
                                    or in the <b>NRF52</b> position to program the board controller.
                                    See the{' '}
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href="https://infocenter.nordicsemi.com/topic/ug_nrf91_dk/UG/nrf91_DK/mcu_device_programming.html"
                                    >
                                        Device programming section in the nRF9160 DK User Guide
                                    </a> for more information.
                                </p>
                            </Alert>
                            <p>To build and program an application:</p>
                            <ol type="a">
                                <li>Select your project in the Project Explorer.</li>
                                <li>From the menu, select <code>Build → Build Solution.</code></li>
                                <li>
                                    When the build completes, you can program the sample to a
                                    connected board:
                                    <ol>
                                        <li>
                                            For a single-image application,
                                            select <code>Target → Download zephyr/zephyr.elf</code>.
                                        </li>
                                        <li>
                                            For a multi-image application,
                                            select <code>Target → Download zephyr/merged.hex</code>.
                                        </li>
                                    </ol>
                                </li>
                            </ol>
                            <Alert variant="primary">
                                Alternatively, choose the <code>Build and Debug</code> option.
                                {' '}<code>Build and Debug</code> will build the application and
                                program it when the build completes.
                            </Alert>
                        </li>
                        <li>
                            To inspect the details of the code that was programmed and the memory
                            usage, click <code>Debug → Go</code>.
                            <Alert variant="primary">
                                In a multi-image build, this allows you to debug the source code of
                                your application only.
                            </Alert>
                        </li>
                    </ol>
                </Card>
            </div>
        </div>
    );
};

export default FirstInstallInstructions;
