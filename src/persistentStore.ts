/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getPersistentStore as store } from '@nordicsemiconductor/pc-nrfconnect-shared';
import os from 'os';
import path from 'path';

import config from './Manager/ToolchainManager/config';

export const oldDefaultInstallDirOnWindows = path.resolve(os.homedir(), 'ncs');

let cachedDefaultInstallPath: string | undefined;

export const persistedInstallDirOfToolChainDefault =
    async (): Promise<string> => {
        cachedDefaultInstallPath =
            process.platform === 'darwin'
                ? cachedDefaultInstallPath ?? undefined
                : store().get('installDir');

        if (!cachedDefaultInstallPath) {
            cachedDefaultInstallPath = (await config()).install_dir;
            return cachedDefaultInstallPath;
        }

        return cachedDefaultInstallPath;
    };

export const persistedInstallDir = (): string | undefined =>
    process.platform === 'darwin' ? undefined : store().get('installDir');

export const setPersistedInstallDir = (dir: string) =>
    store().set('installDir', dir);

export const showPreReleases = (): boolean | undefined =>
    store().get('showPreReleases');

export const setShowPreReleases = (showAll: boolean) =>
    store().set('showPreReleases', showAll);

const indexJson =
    {
        win32: 'index.json',
        darwin: 'index-mac.json',
        linux: 'index-linux.json',
        aix: undefined,
        android: undefined,
        cygwin: undefined,
        freebsd: undefined,
        netbsd: undefined,
        openbsd: undefined,
        sunos: undefined,
    }[process.platform] ?? 'index-linux.json';

export const toolchainIndexUrl = () => {
    const value = store().get(
        'toolchainIndexUrl',
        'https://files.nordicsemi.com/ui/api/v1/download?isNativeBrowsing=true&repoKey=swtools&path=external/legacy-toolchains'
    ) as string;
    return `${value.replace(/\/index.*.json$/, '')}/${indexJson}`;
};
export const toolchainUrl = (name: string) =>
    `${path.dirname(toolchainIndexUrl())}/${name}`;

export const persistedShowMaster = () => store().get('showMaster', false);
export const setPersistedShowMaster = (visible: boolean) =>
    store().set('showMaster', visible);

export const persistedHideOlderEnvironments = () =>
    store().get('hideOlderEnvironments', true);
export const setPersistedHideOlderEnvironments = (visible: boolean) =>
    store().set('hideOlderEnvironments', visible);

export const persistedShowVsCodeDialogDuringInstall = () =>
    store().get('showVsCodeDialogDuringInstall', true);
export const setPersistedShowVsCodeDialogDuringInstall = (visible: boolean) =>
    store().set('showVsCodeDialogDuringInstall', visible);
