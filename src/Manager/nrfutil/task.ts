/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export type TaskEvent = TaskBegin | TaskProgress | TaskEnd;

interface InstallTaskDescriptor {
    id: string;
    description: string;
    name: 'install_toolchain';
    data: {
        install_path: string;
    };
}
interface GenericTaskDescriptor {
    id: string;
    description: string;
    name: 'download_toolchain' | 'unpack_toolchain' | 'remove_toolchain';
}
type TaskDescriptor = InstallTaskDescriptor | GenericTaskDescriptor;

interface TaskBegin {
    type: 'task_begin';
    data: {
        task: TaskDescriptor;
    };
}

interface TaskProgress {
    type: 'task_progress';
    data: {
        task: TaskDescriptor;
        progress: {
            progressPercentage: number;
            description: string;
        };
    };
}

interface TaskEnd {
    type: 'task_end';
    data: {
        task: TaskDescriptor;
        message: string;
        result: 'success' | 'failure';
    };
}

export const describe = (task: TaskDescriptor) => {
    switch (task.name) {
        case 'download_toolchain':
            return 'Downloading toolchain';
        case 'unpack_toolchain':
            return 'Unpacking toolchain';
        case 'install_toolchain':
            return 'Installing toolchain';
        case 'remove_toolchain':
            return 'Removing toolchain';
        default:
            return '';
    }
};
