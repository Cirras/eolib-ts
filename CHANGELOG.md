# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Rename `ItemType.Spell` enum value to `Reserved5`.

## [1.0.0-rc.1] - 2023-02-09

### Added

- Support for EO data structures:
  - Client packets
  - Server packets
  - Endless Map Files (EMF)
  - Endless Item Files (EIF)
  - Endless NPC Files (ENF)
  - Endless Spell Files (ESF)
  - Endless Class Files (ECF)
- Utilities:
  - Data reader
  - Data writer
  - Number encoding
  - String encoding
  - Data encryption
  - Packet sequencer

[unreleased]: https://github.com/cirras/eomap-js/compare/v1.0.0-rc.1...HEAD
[1.0.0-rc.1]: https://github.com/cirras/eomap-js/releases/tag/v1.0.0-rc.1
