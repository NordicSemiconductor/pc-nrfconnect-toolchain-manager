/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { combineReducers } from 'redux';

import appReducer from '../reducers';
import {
    addEnvironment,
    environmentsByVersion,
    getLatestToolchain,
} from './managerSlice';

const older = {
    version: '20200217',
    name: 'ncs-toolchain-v1.2.0-20200217-a56f2eb.zip',
};
const younger = {
    version: '20200218',
    name: 'ncs-toolchain-v1.2.0-20200218-0ef73a3.zip',
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

const reducer = combineReducers({ app: appReducer });
describe('managerReducer', () => {
    it('adds an environment', () => {
        const anEnvironment = { version: 'v1.2.0' };

        const withAnEnvironment = reducer(
            undefined,
            addEnvironment(anEnvironment)
        );

        expect(environmentsByVersion(withAnEnvironment)).toStrictEqual([
            anEnvironment,
        ]);
    });

    it('updates an environment', () => {
        const anEnvironment = { version: 'v1.2.0' };
        const anUpdatedEnvironment = { version: 'v1.2.0', aProp: 'a value' };

        const withAnUpdatedEnvironment = [
            addEnvironment(anEnvironment),
            addEnvironment(anUpdatedEnvironment),
        ].reduce(reducer, undefined);

        expect(environmentsByVersion(withAnUpdatedEnvironment)).toStrictEqual([
            anUpdatedEnvironment,
        ]);
    });

    it('provides a list of all environments', () => {
        const olderEnvironment = { version: 'v1.2.0' };
        const youngerEnvironment = { version: 'v1.3.0' };
        const listOfAllEnvironments = [youngerEnvironment, olderEnvironment];

        const withAllEnvironments = [
            addEnvironment(olderEnvironment),
            addEnvironment(youngerEnvironment),
        ].reduce(reducer, undefined);

        const withAllEnvironmentsAddedInDifferentOrder = [
            addEnvironment(youngerEnvironment),
            addEnvironment(olderEnvironment),
        ].reduce(reducer, undefined);

        expect(environmentsByVersion(withAllEnvironments)).toStrictEqual(
            listOfAllEnvironments
        );
        expect(
            environmentsByVersion(withAllEnvironmentsAddedInDifferentOrder)
        ).toStrictEqual(listOfAllEnvironments);
    });
});
