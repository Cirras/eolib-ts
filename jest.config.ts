import { pathsToModuleNameMapper } from "ts-jest";

import { compilerOptions } from "./tsconfig.json";
import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest/presets/js-with-ts",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  collectCoverageFrom: ["src/**/*.ts"],
  transform: {
    "^.+\\.(ts)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    "^.+\\.(mjs)$": "babel-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!windows-1252/.*)"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper({
    "@eolib/*": ["src/*", "generated/*"],
  }),
};

export default jestConfig;
