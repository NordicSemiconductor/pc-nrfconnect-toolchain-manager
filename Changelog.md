## 1.0.0 - 2022-06-02

### Added

-   Support nRF Connect SDK 2.0.
-   Support Linux (Ubuntu 20.04).

### Changed

-   Split up directories for the SDK and the toolchains, for all versions of nRF
    Connect SDK beginning with 2.0: Before, e.g. in the directory `v1.8.0/` the
    SDK and the toolchain were combined. Now the directory `v2.0.0/` contains
    just the SDK, while the toolchain resides next to it in the directory
    `toolchains/v2.0.0/`.

### Fixed

-   On M1 Macs with a case sensitive filesystem when launching VS Code the
    detection of which version of J-Link is installed was broken.
-   Icons for the status of VS Code Extensions were not displayed.

### Known Issues

-   Tested on Ubuntu 20.04. Currently incompatible with Ubuntu 22.04.
-   Opening a terminal on Linux is not supported yet.

## 0.10.3 - 2022-01-19

### Fixed

-   VS Code Extensions which failed to install were not detected in some cases.

## 0.10.2 - 2022-01-10

### Added

-   Instructions for installing Intel version of VS Code and JLink.

### Changed

-   Color of install progressbar.
-   Icons.

## 0.10.1 - 2021-11-12

### Fixed

-   `Open SDK directory` and `Open toolchain directory` did not work.

## 0.10.0 - 2021-09-27

### Added

-   Launch VS Code with installation instructions.
-   First steps instructions to building with VS Code.
-   Setting to hide older environments.

## 0.9.4 - 2021-09-03

### Fixed

-   On macOS the terminal was missing `/usr/local/bin` in the `PATH`.

## 0.9.3 - 2021-07-04

### Removed

-   Experimental banner for macOS.

## 0.9.2 - 2021-06-23

### Changed

-   Establish compatibility with nRF Connect for Desktop 3.7.

### Fixed

-   Installation would not start.
-   Open IDE button was not working.

## 0.9.1 - 2021-02-08

### Changed

-   Prevented using non-default base path on macOS.

### Fixed

-   Opening SEGGER Embedded Studio on macOS.

## 0.9.0 - 2020-12-18

### Added

-   Dialog and instructions to remove directories that would block installation.

### Changed

-   Disabled First steps screen during installation.

## 0.8.2 - 2020-11-25

### Fixed

-   cmake configuration issue on macOS.

### Changed

-   Minor style update.

## 0.8.1 - 2020-09-30

### Fixed

-   Source code link.

## 0.8.0 - 2020-09-29

### Fixed

-   Unzipping issue on Windows.
-   Incorrect percentage number for download progress.

### Changed

-   Update SES default config with tool paths.

### Added

-   Usage statistics

## 0.7.1 - 2020-07-24

### Fixed

-   Update SDK/toolchain actions.

## 0.7.0 - 2020-07-08

### Added

-   Install toolchain from URL or local file.

## 0.6.1 - 2020-06-09

### Changed

-   NCS clone process without external window on win32.

## 0.6.0 - 2020-06-02

### Added

-   macOS support.

## 0.5.0 - 2020-04-02

-   First public release.

## 0.2.2-beta.1 - 2020-04-01

### Fixed

-   Updating SDK and toolchain.

## 0.2.1-beta.1 - 2020-03-05

### Added

-   Confirmation dialog to remove environment.
-   Error dialog when remove fails.

### Changed

-   App icon.

## 0.2.0-beta.1 - 2020-02-21

-   Initial public beta release.
