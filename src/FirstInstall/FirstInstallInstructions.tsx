/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Card from 'react-bootstrap/Card';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useDispatch, useSelector } from 'react-redux';
import { sep } from 'path';

import { currentInstallDir } from '../InstallDir/installDirSlice';
import { isLegacyEnvironment } from '../Manager/Environment/environmentReducer';
import { hideFirstSteps, selectedVersion } from '../Manager/managerSlice';

import './firstInstallInstructions.scss';

const Ie = () => (
    <>
        {' '}
        <i>i.e.</i>{' '}
    </>
);
const Dotdotdot = () => (
    // eslint-disable-next-line react/button-has-type
    <button className="btn btn-secondary dotdotdot">...</button>
);

const OldSteps = () => {
    const version = useSelector(selectedVersion) || '<version>';
    const installDir = useSelector(currentInstallDir);
    const zephyrDir = [installDir, version, 'zephyr'].join(sep);
    const sampleDir = [zephyrDir, 'samples', 'basic'].join(sep);
    const suggestedExample = 'blinky';
    const suggestExampleCmakelists = [
        sampleDir,
        suggestedExample,
        'CMakeLists.txt',
    ].join(sep);
    const boardName = 'nrf9160_pca10090';
    const suggestExampleBuildDir = [
        sampleDir,
        suggestedExample,
        `build_${boardName}`,
    ].join(sep);
    const exampleBoardDir = [zephyrDir, 'boards', 'arm', boardName].join(sep);

    return (
        <ul>
            <li>
                <b>CMakeLists.txt</b> - the location of the{' '}
                <code>CMakeLists.txt</code> project file of the sample that you
                want to work with
                <br />
                <Ie />
                <code>{suggestExampleCmakelists}</code>
            </li>
            <li>
                <b>Board Directory</b> - the location of the board description
                of the board for which to build the project
                <br />
                <Ie />
                <code>{exampleBoardDir}</code>
            </li>
            <li>
                <b>Board Name</b> - the board name (select from the list that is
                populated based on the board directory)
                <br />
                <Ie />
                <code>{boardName}</code>
            </li>
            <li>
                <b>Build Directory</b> - the directory in which to run the build
                (automatically filled based on the board name, but you can
                specify a different directory)
                <br />
                <Ie />
                <code>{suggestExampleBuildDir}</code>
            </li>
            <li>
                <b>Clean Build Directory</b> - select this option to ensure that
                you are not building with an outdated build cache
            </li>
        </ul>
    );
};

const NewSteps = () => (
    <ul>
        <li>
            <b>nRF Connect SDK Release</b> - Select the nRF Connect SDK version
            that you want to work with.
        </li>
        <li>
            <b>nRF Connect Toolchain Version</b> - Select the version of the
            toolchain that works with the selected nRF Connect SDK version.
        </li>
        <li>
            <b>Projects</b> - Select the project that you want to work with.
            <br />
            Select any of the checkboxes to add samples and applications from
            the respective area to the drop-down list. To add custom projects to
            the drop-down list, click <Dotdotdot /> and select the folder that
            contains the projects that you want to add.
        </li>
        <li>
            <b>Board Name</b> - Select the board that you want to work with.
            <br />
            Select any of the checkboxes to add the respective build targets to
            the drop-down list. To add custom build targets to the drop-down
            list, click <Dotdotdot /> and select the folder that contains the
            board definitions.
            <Alert variant="success">
                <p>
                    Note that if you work with a TrustZone device, you usually
                    build the firmware for the non-secure domain and must
                    therefore select the non-secure build target, for example,{' '}
                    <code>nrf9160dk_nrf9160ns</code> or{' '}
                    <code>nrf5340pdk_nrf5340_cpuappns</code>.
                </p>
            </Alert>
        </li>
        <li>
            <b>Build Directory</b> - Select the folder in which to run the
            build. The field is filled automatically based on the selected board
            name, but you can specify a different directory.
            <br />
        </li>
        <li>
            <b>Clean Build Directory</b> - Select this option to ensure that you
            are not building with an outdated build cache.
        </li>
        <li>
            <b>Extended Settings</b> - Select this option to display a field
            where you can specify additional CMake options to be used for
            building.
        </li>
    </ul>
);

const VSCode = () => (
    <div>
        <Card body className="selectable first-install nrf-card">
            <h4>Building with nRF Connect for VS Code</h4>
            <p>
                Once the installation of the tools and the nRF Connect SDK is
                finished, complete the following steps to build nRF Connect SDK
                projects with VS Code.
            </p>
            <ol>
                <li>
                    Start Visual Studio Code by clicking <b>Open VS Code</b>
                </li>
                <li>
                    Access the Welcome page by one of the following:
                    <ul>
                        <li>
                            Clicking on the nRF Connect for VS Code icon to the
                            left in VS Code.
                        </li>
                        <li>
                            Open the Welcome Page by clicking{' '}
                            <b>Open Welcome page</b>
                        </li>
                        <li>
                            Using the nRF Connect: Welcome command available in
                            the Command Palette (<code>Ctrl+Shift+P</code> or{' '}
                            <code>⇧+⌘+P</code>
                            ).
                        </li>
                    </ul>
                </li>
                <li>
                    Set the default nRF Connect SDK and nRF Connect Toolchain in
                    the Quick Setup feature located on the extension&apos;s
                    Welcome page.
                    <Alert variant="primary">
                        <p>
                            You can browse to your manual installations using
                            the <b>Browse...</b> option.
                        </p>
                        <p>
                            Alternatively, if the toolchain is installed on the
                            system path, you can set the toolchain value to{' '}
                            <code>PATH</code>.
                        </p>
                    </Alert>
                </li>
                <li>
                    Select <b>Add an existing application to workspace...</b>
                    <Alert variant="primary">
                        Alternatively create a new application by clicking{' '}
                        <b>Create a new application from sample...</b>
                    </Alert>
                    You can now work with the project in the IDE.
                </li>
                <li>
                    To build and program an application:
                    <ol type="a">
                        <li>
                            Create a build configuration by clicking{' '}
                            <b>Add build configuration</b>.
                            <ol>
                                <li>
                                    Select the board you are developing for.
                                </li>
                                <li>
                                    Edit the remaining values based on your
                                    needs.
                                </li>
                                <li>
                                    Click <b>Generate Config</b>
                                </li>
                            </ol>
                        </li>
                        <li>
                            Select <b>Build</b>
                        </li>
                        <li>
                            When the build completes, you can program the sample
                            to a connected board by clicking <b>Flash</b>
                        </li>
                    </ol>
                </li>
                <li>
                    Additional documentation and{' '}
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://www.youtube.com/playlist?list=PLx_tBuQ_KSqEt7NK-H7Lu78lT2OijwIMl"
                    >
                        how-to-guides
                    </a>{' '}
                    are available through the <b>Open Walkthrough</b> option on
                    the Welcome page.
                </li>
            </ol>
        </Card>
    </div>
);

const SEGGER = ({ version }: { version: string }) => (
    <div>
        <Card body className="selectable first-install nrf-card">
            <h4>Building with SEGGER Embedded Studio</h4>
            <p>
                Once the installation of the tools and the nRF Connect SDK is
                finished, complete the following steps to build nRF Connect SDK
                projects with SES.
            </p>
            <ol>
                <li>
                    Start SEGGER Embedded Studio by clicking{' '}
                    <b>Open Segger Embedded Studio</b>
                </li>
                <li>
                    Select <code>File → Open nRF Connect SDK Project…</code>
                </li>
                <li>
                    To import a project into SES, you must specify the following
                    information:
                    {version.match(/v1.[23]/) ? <OldSteps /> : <NewSteps />}
                </li>
                <li>
                    Click <b>OK</b> to import the project into SES. You can now
                    work with the project in the IDE.
                </li>
                <li>
                    <p>Build and program your project.</p>
                    <p>
                        The required steps differ depending on if you build a
                        single application or a multi-image project (such as the
                        nRF9160 samples, which include{' '}
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/security/tfm.html"
                        >
                            SPM
                        </a>
                        ).
                    </p>
                    <Alert variant="success">
                        <p>
                            If you are working with an nRF9160 DK, make sure to
                            select the correct controller before you program the
                            application to your board.
                        </p>
                        <p>
                            Put the <b>SW5</b> switch (marked debug/prog) in the{' '}
                            <b>NRF91</b> position to program the main
                            controller, or in the <b>NRF52</b> position to
                            program the board controller. See the{' '}
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://docs.nordicsemi.com/bundle/ug_nrf91_dk/page/UG/nrf91_DK/mcu_device_programming.html"
                            >
                                Device programming section in the nRF9160 DK
                                User Guide
                            </a>{' '}
                            for more information.
                        </p>
                    </Alert>
                    <p>To build and program an application:</p>
                    <ol type="a">
                        <li>Select your project in the Project Explorer.</li>
                        <li>
                            From the menu, select{' '}
                            <code>Build → Build Solution.</code>
                        </li>
                        <li>
                            When the build completes, you can program the sample
                            to a connected board:
                            <ol>
                                <li>
                                    For a single-image application, select{' '}
                                    <code>
                                        Target → Download zephyr/zephyr.elf
                                    </code>
                                    .
                                </li>
                                <li>
                                    For a multi-image application, select{' '}
                                    <code>
                                        Target → Download zephyr/merged.hex
                                    </code>
                                    .
                                </li>
                            </ol>
                        </li>
                    </ol>
                    <Alert variant="primary">
                        Alternatively, choose the <code>Build and Debug</code>{' '}
                        option. <code>Build and Debug</code> will build the
                        application and program it when the build completes.
                    </Alert>
                </li>
                <li>
                    To inspect the details of the code that was programmed and
                    the memory usage, click <code>Debug → Go</code>.
                    <Alert variant="primary">
                        In a multi-image build, this allows you to debug the
                        source code of your application only.
                    </Alert>
                </li>
            </ol>
        </Card>
    </div>
);

const FirstInstallInstructions = () => {
    const dispatch = useDispatch();
    const version = useSelector(selectedVersion) || '<version>';

    return (
        <div>
            <ButtonToolbar className="mb-2">
                <Button
                    className="mdi mdi-arrow-left ml-auto"
                    variant="secondary"
                    onClick={() => dispatch(hideFirstSteps())}
                >
                    Go back
                </Button>
            </ButtonToolbar>
            <Tabs
                className="first-steps-tabs"
                defaultActiveKey="vscode"
                id="uncontrolled-tab"
            >
                <Tab eventKey="vscode" title="VS Code">
                    <VSCode />
                </Tab>
                {isLegacyEnvironment(version) && (
                    <Tab eventKey="segger" title="SEGGER Embedded Studio">
                        <SEGGER version={version} />
                    </Tab>
                )}
            </Tabs>
            <ButtonToolbar className="mt-2">
                <Button
                    className="mdi mdi-arrow-left ml-auto"
                    variant="secondary"
                    onClick={() => dispatch(hideFirstSteps())}
                >
                    Go back
                </Button>
            </ButtonToolbar>
        </div>
    );
};

export default FirstInstallInstructions;
