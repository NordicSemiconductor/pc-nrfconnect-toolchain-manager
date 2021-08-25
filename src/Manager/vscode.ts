import { spawnSync } from 'child_process';

// Not sure where to get this from yet.
const EXTENSION_IDENTIFIER = 'nordic-semiconductor.nrf-connect';

export enum VsCodeStatus {
    INSTALLED,
    EXTENSION_MISSING,
    NOT_INSTALLED,
}

export function getVsCodeStatus() {
    const { stdout, status, error } = spawnSync('code', ['--list-extensions'], {
        shell: true,
    });

    if (error || status !== 0) {
        return VsCodeStatus.NOT_INSTALLED;
    }

    const extensions = Array.from(stdout)
        .map(character => String.fromCharCode(character))
        .join('')
        .trim()
        .split('\n');

    const hasNrfConnectExtension = extensions.includes(EXTENSION_IDENTIFIER);

    return hasNrfConnectExtension
        ? VsCodeStatus.INSTALLED
        : VsCodeStatus.EXTENSION_MISSING;
}
