/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { testUtils } from '@nordicsemiconductor/pc-nrfconnect-shared/test';

import appReducer from '../reducers';
import { Environment } from '../state';
import {
    addEnvironment,
    environmentsByVersion,
    getLatestToolchain,
} from './managerSlice';

jest.mock('./ToolchainManager/config', () => ({
    __esModule: true,
    default: jest.fn(() => ({})),
}));

const older = {
    version: '20200217',
    name: 'ncs-toolchain-v1.2.0-20200217-a56f2eb.zip',
    sha512: 'a sha512',
};
const younger = {
    version: '20200218',
    name: 'ncs-toolchain-v1.2.0-20200218-0ef73a3.zip',
    sha512: 'another sha512',
};

const exampleEnvironment: Environment = {
    type: 'nrfUtil',
    version: 'v1.2.0',
    toolchainDir: '',
    toolchains: [],
    abortController: new AbortController(),
};

describe('getLatestToolchain', () => {
    it('gets the latest of several toolchains', () => {
        expect(getLatestToolchain([younger, older])).toBe(younger);
        expect(getLatestToolchain([older, younger])).toBe(younger);
    });

    it('does not alter the supplied list of toolchains', () => {
        const toolchains = [older, younger];
        getLatestToolchain(toolchains);

        expect(toolchains).toStrictEqual([older, younger]);
    });
});

const reducer = testUtils.rootReducer(appReducer);
describe('managerReducer', () => {
    it('adds an environment', () => {
        const anEnvironment = exampleEnvironment;

        const withAnEnvironment = testUtils.dispatchTo(reducer, [
            addEnvironment(anEnvironment),
        ]);

        expect(environmentsByVersion(withAnEnvironment)).toStrictEqual([
            anEnvironment,
        ]);
    });

    it('updates an environment', () => {
        const anEnvironment = exampleEnvironment;
        const anUpdatedEnvironment = {
            ...anEnvironment,
            toolchainDir: 'changeDir',
        };

        const withAnUpdatedEnvironment = testUtils.dispatchTo(reducer, [
            addEnvironment(anEnvironment),
            addEnvironment(anUpdatedEnvironment),
        ]);

        expect(environmentsByVersion(withAnUpdatedEnvironment)).toStrictEqual([
            anUpdatedEnvironment,
        ]);
    });

    it('provides a list of all environments', () => {
        const olderEnvironment = { ...exampleEnvironment, version: 'v1.2.0' };
        const youngerEnvironment = { ...exampleEnvironment, version: 'v1.3.0' };
        const listOfAllEnvironments = [youngerEnvironment, olderEnvironment];

        const withAllEnvironments = testUtils.dispatchTo(reducer, [
            addEnvironment(olderEnvironment),
            addEnvironment(youngerEnvironment),
        ]);

        const withAllEnvironmentsAddedInDifferentOrder = testUtils.dispatchTo(
            reducer,
            [
                addEnvironment(youngerEnvironment),
                addEnvironment(olderEnvironment),
            ]
        );

        expect(environmentsByVersion(withAllEnvironments)).toStrictEqual(
            listOfAllEnvironments
        );
        expect(
            environmentsByVersion(withAllEnvironmentsAddedInDifferentOrder)
        ).toStrictEqual(listOfAllEnvironments);
    });
});
