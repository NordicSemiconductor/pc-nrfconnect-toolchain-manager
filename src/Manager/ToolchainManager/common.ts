/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getUserDataDir } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { NrfutilSandbox } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';
import { getNrfutilLogger } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/nrfutilLogger';
import sandbox from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/sandbox';
import {
    getIsLoggingVerbose,
    persistIsLoggingVerbose,
} from '@nordicsemiconductor/pc-nrfconnect-shared/src/utils/persistentStore';

let toolchainManagerSandbox: NrfutilSandbox | undefined;
let promiseToolChainManagerSandbox: Promise<NrfutilSandbox> | undefined;

export const getToolChainManagerSandbox = async () => {
    if (toolchainManagerSandbox) {
        return toolchainManagerSandbox;
    }

    if (!promiseToolChainManagerSandbox) {
        promiseToolChainManagerSandbox = sandbox(
            getUserDataDir(),
            'toolchain-manager',
            undefined,
            undefined
        );
        toolchainManagerSandbox = await promiseToolChainManagerSandbox;

        toolchainManagerSandbox.onLogging((evt, pid) => {
            const logger = getNrfutilLogger();
            const formatMsg = (msg: string) =>
                `${
                    pid && toolchainManagerSandbox?.logLevel === 'trace'
                        ? `[PID:${pid}] `
                        : ''
                }${msg}`;

            switch (evt.level) {
                case 'TRACE':
                    logger?.verbose(formatMsg(evt.message));
                    break;
                case 'DEBUG':
                    logger?.debug(formatMsg(evt.message));
                    break;
                case 'INFO':
                    logger?.info(formatMsg(evt.message));
                    break;
                case 'WARN':
                    logger?.warn(formatMsg(evt.message));
                    break;
                case 'ERROR':
                    logger?.error(formatMsg(evt.message));
                    break;
                case 'CRITICAL':
                    logger?.error(formatMsg(evt.message));
                    break;
                case 'OFF':
                default:
                    // Unreachable
                    break;
            }
        });

        const fallbackLevel =
            process.env.NODE_ENV === 'production' ? 'off' : 'error';
        toolchainManagerSandbox.setLogLevel(
            getIsLoggingVerbose() ? 'trace' : fallbackLevel
        );
        // Only the first reset after selecting "reset with verbose logging" is relevant
        persistIsLoggingVerbose(false);
    }

    const box = await promiseToolChainManagerSandbox;
    return box;
};
