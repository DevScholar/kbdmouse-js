# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.6] - 2025-??-??

### Added
- Added constructor validation for VkMouse to ensure element is connected to DOM
- Added viewport boundary validation for mouse coordinates
- Added null check for document.elementFromPoint() return value
- Added package.json metadata fields (repository, author, keywords, bugs, homepage)

### Security
- Improved input validation for mouse event coordinates

## [0.0.5] - 2025-??-??

### Added
- Initial release
- Virtual keyboard support for mobile devices
- Mouse polyfill for touch-to-mouse event translation
- Multi-touch gesture support (two-finger scroll)
- Double-tap detection for drag operations
