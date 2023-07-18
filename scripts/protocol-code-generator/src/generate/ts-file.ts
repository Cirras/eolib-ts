import * as fs from "fs";
import * as path from "path";
import { CodeBlock } from "./code-block";

export class TSFile {
  private relativePath: string;
  private codeBlock: CodeBlock;

  public constructor(relativePath: string, codeBlock: CodeBlock) {
    this.relativePath = relativePath;
    this.codeBlock = codeBlock;
  }

  public write(rootPath: string): void {
    const outputPath = path.join(rootPath, this.relativePath);

    const header = new CodeBlock()
      .addLine("// Generated from the eo-protocol XML specification.")
      .addLine("//")
      .addLine("// This file should not be modified.")
      .addLine("// Changes will be lost when code is regenerated.")
      .addLine();

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(
      outputPath,
      header.toString() + this.codeBlock.toString(),
      "utf-8",
    );
  }
}
