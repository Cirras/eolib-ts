# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/cirras/eomap-js/compare/v1.0.0-rc.2...HEAD
[1.0.0-rc.2]: https://github.com/cirras/eomap-js/releases/tag/v1.0.0-rc.2
[1.0.0-rc.1]: https://github.com/cirras/eomap-js/releases/tag/v1.0.0-rc.1
