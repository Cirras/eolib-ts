import * as path from "path";

import { CustomType } from "../type/custom-type";
import { pascalCaseToKebabCase } from "../util/name-utils";

export class CodeBlock {
  private imports: Set<string>;
  private lines: string[];
  private indentation: number;

  public constructor() {
    this.imports = new Set();
    this.lines = [""];
    this.indentation = 0;
  }

  public add(code: string): this {
    const parts = code.split("\n");
    for (let i = 0; i < parts.length; ++i) {
      if (parts[i].length > 0) {
        const lineIndex = this.lines.length - 1;
        if (this.lines[lineIndex].length === 0) {
          this.lines[lineIndex] = " ".repeat(this.indentation * 2);
        }
        this.lines[lineIndex] += parts[i];
      }
      if (i !== parts.length - 1) {
        this.lines.push("");
      }
    }
    return this;
  }

  public addLine(line: string = ""): this {
    this.add(`${line}\n`);
    return this;
  }

  public addCodeBlock(block: CodeBlock): this {
    for (const i of block.imports) {
      this.imports.add(i);
    }

    for (let i = 0; i < block.lines.length; ++i) {
      if (i === block.lines.length - 1) {
        this.add(block.lines[i]);
      } else {
        this.addLine(block.lines[i]);
      }
    }

    return this;
  }

  public addImport(imported: string, path: string): this {
    this.imports.add(`import { ${imported} } from "@eolib/${path}";`);
    return this;
  }

  public addImportByType(type: CustomType): this {
    this.addImport(
      type.name,
      path.posix.join(
        type.sourcePath,
        pascalCaseToKebabCase(type.name) + ".js",
      ),
    );
    return this;
  }

  public addStatement(statement: string): this {
    this.addLine(`${statement};`);
    return this;
  }

  public beginControlFlow(controlFlow: string): this {
    this.addLine(controlFlow + " {");
    this.indent();
    return this;
  }

  public nextControlFlow(controlFlow: string): this {
    this.unindent();
    this.addLine("} " + controlFlow + " {");
    this.indent();
    return this;
  }

  public endControlFlow(controlFlow: string = ""): this {
    this.unindent();
    this.add("}");
    if (controlFlow) {
      this.add(` ${controlFlow};`);
    }
    this.add("\n");
    return this;
  }

  public indent(): this {
    ++this.indentation;
    return this;
  }

  public unindent(): this {
    --this.indentation;
    return this;
  }

  public get empty(): boolean {
    return this.lines.length === 1 && this.lines[0].length === 0;
  }

  public toString(): string {
    let result: string = "";
    for (const i of this.imports) {
      result += i + "\n";
    }

    if (!this.empty) {
      if (result.length > 0) {
        result += "\n";
      }

      result += this.lines.join("\n");
    }

    return result;
  }
}
