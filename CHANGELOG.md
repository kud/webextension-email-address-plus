# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.6] - 2025-08-09

### Changed
- Version bump

## [4.0.5] - 2025-08-09

### Changed
- Updated publishing workflow to use Mozilla's listed channel for public distribution
- Automated version synchronization between package.json and manifest.json
- Enhanced build process with automatic changelog integration for AMO releases

### Fixed
- Resolved version conflicts during extension publishing
- Improved deployment pipeline for Mozilla Add-on store submissions

## [2.0.0] - 2025-08-09

### Added
- Dynamic icon switching based on browser theme and toolbar colors
- Support for adaptive tab color extensions
- Enhanced theme detection using toolbar color brightness analysis
- Theme permission for better browser integration

### Changed
- Improved icon update logic to work with dynamic toolbar colors
- Enhanced background script with better error handling
- Updated package.json with proper metadata and modern tooling

### Fixed
- Icon now properly adapts to light/dark themes in real-time
- Resolved issue where icon wouldn't change with adaptive tab color extensions
- Fixed theme detection to work with system preferences and custom themes

## [1.2.0] - Previous Release

### Added
- Better icon and UK domain handling
- Dynamic icon update and tooltip for copied email address functionality

### Changed
- Improved domain handling logic

## [0.1.0] - Initial Release

### Added
- Basic email address plus-labeling functionality
- Browser action with popup
- Options page for configuration
- Keyboard shortcut support
- Multi-locale support