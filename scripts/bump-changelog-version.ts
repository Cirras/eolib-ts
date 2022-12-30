import { parser, Release, Changelog } from "keep-a-changelog";
import fs from "fs";

const version: string = require("../package.json").version;
const changelog: Changelog = parser(fs.readFileSync("CHANGELOG.md", "utf-8"));

const existing = changelog.findRelease(version);
if (existing) {
  throw new Error(`Release notes already exist for version ${version}`);
}

let unreleased: Release | undefined = changelog.findRelease();
if (!unreleased) {
  unreleased = new Release();
  changelog.addRelease(unreleased);
}

unreleased.setVersion(version);
unreleased.setDate(new Date());

changelog.addRelease(new Release());

fs.writeFileSync("CHANGELOG.md", changelog.toString(), { encoding: "utf-8" });
