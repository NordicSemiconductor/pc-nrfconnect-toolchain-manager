/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getModule } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';
import {
    LogLevel,
    LogMessage,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/sandboxTypes';

import config from './config';
import env from './env';
import install from './install';
import list from './list';
import search from './search';
import { launchGnomeTerminal, launchTerminal, launchWinBash } from './terminal';
import uninstall from './uninstall';
import { westExport, westInit, westUpdate } from './west';

const onLogging = async (handler: (logging: LogMessage) => void) => {
    const sandbox = await getModule('toolchain-manager');
    return sandbox.onLogging(handler);
};

const setLogLevel = async (level: LogLevel) => {
    const sandbox = await getModule('toolchain-manager');
    sandbox.setLogLevel(level);
};

const setVerboseLogging = async (verbose: boolean) => {
    const sandbox = await getModule('toolchain-manager');
    const fallbackLevel =
        process.env.NODE_ENV === 'production' ? 'off' : 'error';

    sandbox.setLogLevel(verbose ? 'trace' : fallbackLevel);
};
const getModuleVersion = async () => {
    const sandbox = await getModule('toolchain-manager');
    return sandbox.getModuleVersion();
};

export default {
    config,
    env,
    install,
    list,
    search,
    uninstall,
    onLogging,
    setLogLevel,
    setVerboseLogging,
    getModuleVersion,
    westInit,
    westUpdate,
    westExport,
    launchGnomeTerminal,
    launchTerminal,
    launchWinBash,
};
