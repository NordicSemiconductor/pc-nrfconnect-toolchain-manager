import { NrfConnectState } from 'pc-nrfconnect-shared';
import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

export type Toolchain = {
    version: string;
    name: string;
    sha512: string;
    uri?: string;
};

export type ToolchainSource = {
    toolchainRootUrl: string;
    isDialogVisible: boolean;
};

export type Environment = {
    version: string;
    toolchainDir: string;
    isWestPresent?: boolean;
    isInstalled?: boolean;
    toolchains: Toolchain[];
    isInstallingToolchain?: boolean;
    isCloningSdk?: boolean;
    isRemoving?: boolean;
    progress?: number;
    stage?: 'Downloading' | 'Installing';
};
export type Environments = {
    [key: string]: Environment;
};

export type ConfirmDialogState = {
    callback?: (isCancelled: boolean) => void;
    title?: string;
    content?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onOptional?: (isCancelled: boolean) => void;
    optionalLabel?: string;
};

export type Manager = {
    environments: Environments;
    dndPackage: string | null;
    isRemoveDirDialogVisible: boolean;
    isInstallPackageDialogVisible: boolean;
    isMasterVisible: boolean;
    isVsCodeVisible: boolean;
    isShowingFirstSteps: boolean;
    versionToRemove: string;
    selectedVersion?: string;
};

export type AppState = {
    firstInstall: {
        isDialogVisible: boolean;
    };
    installDir: {
        currentDir: string;
        isDialogVisible: boolean;
        dialogFlavour: null;
        versionToInstall: string;
    };
    manager: Manager;
    toolchainSource: ToolchainSource;
    reduxConfirmDialog: ConfirmDialogState;
};

export type RootState = NrfConnectState<AppState>;
export type Dispatch = ThunkDispatch<RootState, null, AnyAction>;
