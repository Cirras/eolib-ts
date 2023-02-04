# EOLib

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Cirras_eolib-ts&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Cirras_eolib-ts)
[![Format](https://github.com/Cirras/eolib-ts/actions/workflows/format.yml/badge.svg?event=push)](https://github.com/Cirras/eolib-ts/actions/workflows/format.yml)
[![Build](https://github.com/Cirras/eolib-ts/actions/workflows/build.yml/badge.svg?event=push)](https://github.com/Cirras/eolib-ts/actions/workflows/build.yml)
[![Release](https://github.com/Cirras/eolib-ts/actions/workflows/release.yml/badge.svg)](https://github.com/Cirras/eolib-ts/actions/workflows/release.yml)

A core TypeScript library for writing applications related to Endless Online.

## Features

Read and write the following EO data structures:

- Client packets
- Server packets
- Endless Map Files (EMF)
- Endless Item Files (EIF)
- Endless NPC Files (ENF)
- Endless Spell Files (ESF)
- Endless Class Files (ECF)

Utilities:

- Data reader
- Data writer
- Number encoding
- String encoding
- Data encryption
- Packet sequencer

## Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm install`       | Install project dependencies               |
| `npm run build`     | Build cjs and esm with production settings |
| `npm run build:cjs` | Build cjs with production settings         |
| `npm run build:esm` | Build esm with production settings         |
| `npm run format`    | Format changed files using Prettier        |
| `npm test`          | Run unit tests                             |
