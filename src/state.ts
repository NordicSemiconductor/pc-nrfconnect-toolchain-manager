import { NrfConnectState } from 'pc-nrfconnect-shared';

export type Toolchain = {
    version: string;
    name: string;
    sha512: string;
};

export type ToolchainSource = {
    toolchainRootUrl: string;
    isDialogVisible: boolean;
};

export type Environment = {
    version: string;
    toolchainDir?: string;
    isWestPresent?: boolean;
    isInstalled?: boolean;
    toolchains?: Toolchain[];
    isInstallingToolchain?: boolean;
    isCloningSdk?: boolean;
    isRemoving?: boolean;
    progress?: number;
    stage?: 'Downloading' | 'Installing';
};

export type ConfirmDialogAction = {
    callback: (isCancelled: boolean) => void;
    title?: string;
    content?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onOptional?: (isCancelled: boolean) => void;
    optionalLabel?: string;
};

export type AppState = {
    firstInstall: {
        isDialogVisible: boolean;
    };
    installDir: {
        currentDir: string;
        isDialogVisible: boolean;
        dialogFlavour: null;
        versionToInstall: null;
    };
    manager: {
        environments: {
            [key: string]: Environment | undefined;
        };
        dndPackage: null;
        isRemoveDirDialogVisible: boolean;
        isInstallPackageDialogVisible: boolean;
        isMasterVisible: boolean;
        isShowingFirstSteps: boolean;
        versionToRemove: string;
        selectedVersion: string;
    };
    toolchainSource: ToolchainSource;
    reduxConfirmDialog: ConfirmDialogAction;
};

export type RootState = NrfConnectState<AppState>;
