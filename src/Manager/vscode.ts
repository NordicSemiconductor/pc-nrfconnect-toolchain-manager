import { spawnSync } from 'child_process';

// Not sure where to get this from yet.
const REQUIRED_EXTENSIONS = [
    'nordic-semiconductor.nrf-connect',
    'marus25.cortex-debug',
];
const RECOMENDED_EXTENSIONS = [
    'luveti.kconfig',
    'plorefice.devicetree',
    'ms-vscode.cpptools',
];

export enum VsCodeStatus {
    INSTALLED,
    EXTENSIONS_MISSING,
    NOT_INSTALLED,
}

export function getVsCodeStatus() {
    const extensions = listInstalledExtensions();

    if (extensions === null) {
        return VsCodeStatus.NOT_INSTALLED;
    }

    const hasRequiredExtensions = REQUIRED_EXTENSIONS.every(extension =>
        extensions.includes(extension)
    );

    return hasRequiredExtensions
        ? VsCodeStatus.INSTALLED
        : VsCodeStatus.EXTENSIONS_MISSING;
}

export function installExtensions(fromVsix = false) {
    const existing = listInstalledExtensions();
    const missing = [...REQUIRED_EXTENSIONS, ...RECOMENDED_EXTENSIONS].filter(
        identifier => !existing?.includes(identifier)
    );
    missing.forEach(extension => installExtension(extension, fromVsix));
}

function installExtension(identifier: string, fromVsix: boolean) {
    const pathOrIdentifier = fromVsix ? getPath(identifier) : identifier;

    return spawnSync('code', ['--install-extension', pathOrIdentifier], {
        shell: true,
    }).status;
}

function listInstalledExtensions() {
    const { stdout, status, error } = spawnSync('code', ['--list-extensions'], {
        shell: true,
    });

    if (error || status !== 0) {
        return null;
    }

    return Array.from(stdout)
        .map(character => String.fromCharCode(character))
        .join('')
        .trim()
        .split('\n');
}

function getPath(identifier: string) {
    return identifier;
}
