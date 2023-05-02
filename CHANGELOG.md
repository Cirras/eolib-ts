# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-rc.4] - 2023-05-02

### Added

- Support for new `blob` type, which maps to `byte[]`.

### Changed

- Rename `ItemType.Money` to `Currency`.
- Rename `ItemType.Beer` to `Alcohol`.
- Change `EsfRecord.element` field type from `char` to `Element`.
- Improve docs on `EifRecord.spec*` fields.
- Change `EmfFile.content` field type from array of `byte` to `blob`.
- Change `PubFile.content` field type from array of `byte` to `blob`.

### Fixed

- Change incorrect `WalkCloseServerPacket` dummy value from `f` to `S`.
- Change incorrect `WalkOpenServerPacket` dummy value from `u` to `S`.
- Change incorrect `ByteCoords.x` field type from `short` to `byte`.
- Change incorrect `ByteCoords.y` field type from `short` to `byte`.

## [1.0.0-rc.3] - 2023-04-08

### Added

- Sanitize `0xFF` bytes in strings when writing chunked data structures.

### Changed

- Rename `AdminLevel.Guide` enum value to `Spy`.
- Rename `AdminLevel.Guardian` enum value to `LightGuide`.
- Rename `AdminLevel.Gm` enum value to `Guardian`.
- Rename `AdminLevel.Hgm` enum value to `GameMaster`.
- Rename `AdminLevel.Reserved5` enum value to `HighGameMaster`.
- Rename `ServerSettings.lightGuideFloodRate` field to `spyAndLightGuideFloodRate`.
- Rename `ServerSettings.gameMasterAndHighGameMasterFloodRate` field to `gameMasterFloodRate`.
- Rename `ServerSettings.reserved5FloodRate` field to `highGameMasterFloodRate`.
- Add missing `PaperdollRemoveServerPacket.itemId` field.
- Add missing `PaperdollRemoveServerPacket.subLoc` field.
- Add missing `PaperdollAgreeServerPacket.itemId` field.
- Add missing `PaperdollAgreeServerPacket.remainingAmount` field.
- Add missing `PaperdollAgreeServerPacket.subLoc` field.

### Fixed

- Change incorrect `LockerGetServerPacket.takenItem` field type from `Item` to `ThreeItem`.

## [1.0.0-rc.2] - 2023-02-16

### Added

- `Element` enum.
- `PacketFamily.Error` enum value.
- `PacketAction.Error` enum value.
- `PacketAction.Net243` enum value.
- `PacketAction.Net244` enum value.
- `TalkPlayerClientPacket` packet class.
- `TalkUseClientPacket` packet class.
- `AttackErrorServerPacket` packet class.
- `SpellErrorServerPacket` packet class.
- `WarpPlayerServerPacket` packet class.
- `WarpCreateServerPacket` packet class.
- `WelcomePingServerPacket` packet class.
- `WelcomePongServerPacket` packet class.
- `WelcomeNet242ServerPacket` packet class.
- `WelcomeNet243ServerPacket` packet class.
- `WelcomeNet244ServerPacket` packet class.
- `PlayersListServerPacket` packet class.
- `PlayersReplyServerPacket` packet class.
- `MapFile` class.
- `PubFile` class.
- `PlayersList` class.
- `PlayersListFriends` class.

### Changed

- Rename `ItemType.Spell` enum value to `Reserved5`.
- Rename `PacketAction.Net3` enum value to `Net242`.
- Rename `InitReply.Players` enum value to `PlayersList`.
- Rename `InitReply.FriendsListPlayers` enum value to `PlayersListFriends`.
- Change `EifRecord.element` field type from `char` to `Element`.
- Change `EnfRecord.element` field type from `short` to `Element`.
- Change `EnfRecord.elementWeakness` field type from `short` to `Element`.
- Change incorrect `QuestRequirementIcon` underlying type from `char` to `short`.
- Roll `InitInitServerPacket.ReplyCodeDataWarpMap` fields into new `mapFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataFileEmf` fields into new `mapFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataFileEif` fields into new `pubFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataFileEnf` fields into new `pubFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataFileEsf` fields into new `pubFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataFileEcf` fields into new `pubFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataMapMutation` fields into new `mapFile` field.
- Roll `InitInitServerPacket.ReplyCodeDataPlayersList` fields into new `playersList` field.
- Roll `InitInitServerPacket.ReplyCodeDataPlayersListFriends` fields into new `playersList` field.

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

[unreleased]: https://github.com/cirras/eolib-ts/compare/v1.0.0-rc.4...HEAD
[1.0.0-rc.4]: https://github.com/cirras/eolib-ts/compare/v1.0.0-rc.3...v1.0.0-rc.4
[1.0.0-rc.3]: https://github.com/cirras/eolib-ts/compare/v1.0.0-rc.2...v1.0.0-rc.3
[1.0.0-rc.2]: https://github.com/cirras/eolib-ts/compare/v1.0.0-rc.1...v1.0.0-rc.2
[1.0.0-rc.1]: https://github.com/cirras/eolib-ts/releases/tag/v1.0.0-rc.1
