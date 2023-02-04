import * as fs from "fs";
import * as path from "path";

import chalk from "chalk";
import { replaceTscAliasPaths } from "tsc-alias";

async function main() {
  const buildType = process.argv[2];
  if (buildType !== "esm" && buildType !== "cjs") {
    throw new Error(`Unknown build type: "${buildType}"`);
  }

  const configFile = path.resolve(
    `${__dirname}/../config/tsconfig.${buildType}.json`
  );
  const declarationDir = path.resolve(`${__dirname}/../lib/${buildType}/types`);

  const out = path.resolve(`${__dirname}/../lib/${buildType}`);
  const generatedTypes = `${out}/types/generated/`;
  const srcTypes = `${out}/types/src/`;

  console.log(`Processing ${chalk.bold("declaration files")}.`);
  fs.cpSync(generatedTypes, srcTypes, { recursive: true });
  fs.rmSync(generatedTypes, { recursive: true, force: true });
  await replaceTscAliasPaths({
    configFile,
    outDir: declarationDir,
    declarationDir: undefined,
  });

  const generated = `${out}/generated/`;
  const src = `${out}/src/`;

  console.log(`Processing ${chalk.bold("compiled source files")}.`);
  fs.cpSync(generated, src, { recursive: true });
  fs.rmSync(generated, { recursive: true, force: true });
  await replaceTscAliasPaths({ configFile, declarationDir: undefined });

  console.log(chalk.green("Build completed successfully."));
}

main();
