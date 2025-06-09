import * as fs from "fs";
import * as path from "path";

import chalk from "chalk";
import { parseXml, XmlDocument, XmlElement } from "@rgrove/parse-xml";

import { TSFile } from "./ts-file";
import { TypeFactory } from "../type/type-factory";
import { EnumType, EnumValue } from "../type/enum-type";
import { findFiles } from "../util/fs-utils";
import { pascalCaseToKebabCase } from "../util/name-utils";
import {
  getComment,
  getInstructions,
  getRequiredStringAttribute,
} from "../util/xml-utils";
import { StructType } from "../type/struct-type";
import { generateTsDoc } from "../util/doc-utils";
import { ObjectCodeGenerator } from "./object-code-generator";
import { CodeBlock } from "./code-block";

export class ProtocolCodeGenerator {
  private readonly inputRoot: string;
  private readonly protocolFiles: XmlElement[];
  private readonly exports: string[];
  private readonly packetPaths: Map<XmlElement, string>;
  private readonly typeFactory: TypeFactory;
  private outputRoot: string;

  public constructor(inputRoot: string) {
    this.inputRoot = inputRoot;
    this.protocolFiles = [];
    this.exports = [];
    this.packetPaths = new Map();
    this.typeFactory = new TypeFactory();
    this.outputRoot = null;
  }
  public generate(outputRoot: string): void {
    this.outputRoot = outputRoot;
    try {
      this.indexProtocolFiles();
      this.generateSourceFiles();
      this.generateIndex();
    } finally {
      this.protocolFiles.length = 0;
      this.exports.length = 0;
      this.packetPaths.clear();
      this.typeFactory.clear();
    }
  }

  private indexProtocolFiles(): void {
    findFiles(
      this.inputRoot,
      (file) => path.basename(file) === "protocol.xml",
    ).forEach(this.indexProtocolFile, this);
  }

  private indexProtocolFile(file: string): void {
    console.log(`${chalk.yellow("Indexing")} ${file}`);

    try {
      const xml: string = fs.readFileSync(file, "utf-8");
      const document: XmlDocument = parseXml(xml);

      const protocolElements = document.children.filter(
        (element) =>
          element instanceof XmlElement && element.name === "protocol",
      ) as XmlElement[];

      if (protocolElements.length === 0) {
        throw new Error("Expected a root <protocol> element.");
      }

      const protocol: XmlElement = protocolElements[0];
      this.protocolFiles.push(protocol);

      const enumElements = protocol.children.filter(
        (element) => element instanceof XmlElement && element.name === "enum",
      ) as XmlElement[];

      const structElements = protocol.children.filter(
        (element) => element instanceof XmlElement && element.name === "struct",
      ) as XmlElement[];

      const packetElements = protocol.children.filter(
        (element) => element instanceof XmlElement && element.name === "packet",
      ) as XmlElement[];

      const sourcePath =
        "protocol/" + path.dirname(path.posix.relative(this.inputRoot, file));

      for (let protocolEnum of enumElements) {
        if (!this.typeFactory.defineCustomType(protocolEnum, sourcePath)) {
          throw new Error(
            `${getRequiredStringAttribute(
              protocolEnum,
              "name",
            )} type cannot be redefined.`,
          );
        }
      }

      for (let protocolStruct of structElements) {
        if (!this.typeFactory.defineCustomType(protocolStruct, sourcePath)) {
          throw new Error(
            `${getRequiredStringAttribute(
              protocolStruct,
              "name",
            )} type cannot be redefined.`,
          );
        }
      }

      const declaredPackets: Set<string> = new Set();
      for (let protocolPacket of packetElements) {
        const packetIdentifier =
          getRequiredStringAttribute(protocolPacket, "family") +
          "_" +
          getRequiredStringAttribute(protocolPacket, "action");

        if (declaredPackets.has(packetIdentifier)) {
          throw new Error(
            `${packetIdentifier} packet cannot be redefined in the same file.`,
          );
        }

        declaredPackets.add(packetIdentifier);
        this.packetPaths.set(protocolPacket, sourcePath);
      }
    } catch (e) {
      console.error(`Failed to read ${file}`);
      throw e;
    }
  }

  private generateSourceFiles(): void {
    this.protocolFiles.forEach(this.generateSourceFile, this);
  }

  private generateSourceFile(protocol: XmlElement): void {
    const enumElements = protocol.children.filter(
      (element) => element instanceof XmlElement && element.name === "enum",
    ) as XmlElement[];

    const structElements = protocol.children.filter(
      (element) => element instanceof XmlElement && element.name === "struct",
    ) as XmlElement[];

    const packetElements = protocol.children.filter(
      (element) => element instanceof XmlElement && element.name === "packet",
    ) as XmlElement[];

    const tsFiles: TSFile[] = [
      ...enumElements.map(this.generateEnum, this),
      ...structElements.map(this.generateStruct, this),
      ...packetElements.map(this.generatePacket, this),
    ];

    tsFiles.forEach((tsFile) => tsFile.write(this.outputRoot));
  }

  private generateEnum(protocolEnum: XmlElement): TSFile {
    const type = this.typeFactory.getType(
      getRequiredStringAttribute(protocolEnum, "name"),
    ) as EnumType;

    console.log(`${chalk.blue("Generating enum")}: ${type.name}`);

    const codeBlock = new CodeBlock()
      .addCodeBlock(generateTsDoc(getComment(protocolEnum)))
      .addLine(`export enum ${type.name} {`)
      .indent();

    protocolEnum.children
      .filter((child) => child instanceof XmlElement)
      .map((child) => child as XmlElement)
      .filter((child) => child.name === "value")
      .forEach((protocolValue) => {
        const valueName = getRequiredStringAttribute(protocolValue, "name");
        const value: EnumValue = type.getEnumValueByName(valueName);
        codeBlock
          .addCodeBlock(generateTsDoc(getComment(protocolValue)))
          .addLine(`${value.name} = ${value.ordinalValue},`);
      });

    codeBlock.unindent().addLine("}");

    const relativePath = path.posix.join(
      type.sourcePath,
      pascalCaseToKebabCase(type.name),
    );
    this.exports.push(relativePath + ".js");

    return new TSFile(relativePath + ".ts", codeBlock);
  }

  private generateStruct(protocolStruct: XmlElement): TSFile {
    const type = this.typeFactory.getType(
      getRequiredStringAttribute(protocolStruct, "name"),
    ) as StructType;

    console.log(`${chalk.green("Generating struct")}: ${type.name}`);

    const objectCodeGenerator = new ObjectCodeGenerator(
      type.name,
      this.typeFactory,
    );

    getInstructions(protocolStruct).forEach(
      objectCodeGenerator.generateInstruction,
      objectCodeGenerator,
    );

    const relativePath = path.posix.join(
      type.sourcePath,
      pascalCaseToKebabCase(type.name),
    );
    this.exports.push(relativePath + ".js");

    return new TSFile(
      relativePath + ".ts",
      new CodeBlock()
        .addCodeBlock(generateTsDoc(getComment(protocolStruct)))
        .addCodeBlock(objectCodeGenerator.code),
    );
  }

  private generatePacket(protocolPacket: XmlElement): TSFile {
    const sourcePath = this.packetPaths.get(protocolPacket);
    const packetSuffix = ProtocolCodeGenerator.makePacketSuffix(sourcePath);
    const familyAttribute = getRequiredStringAttribute(
      protocolPacket,
      "family",
    );
    const actionAttribute = getRequiredStringAttribute(
      protocolPacket,
      "action",
    );
    const packetTypeName = familyAttribute + actionAttribute + packetSuffix;

    console.log(`${chalk.magenta("Generating packet")}: ${packetTypeName}`);

    const familyType = this.typeFactory.getType("PacketFamily");
    if (!(familyType instanceof EnumType)) {
      throw new Error("PacketFamily enum is missing.");
    }

    const actionType = this.typeFactory.getType("PacketAction");
    if (!(actionType instanceof EnumType)) {
      throw new Error("PacketAction enum is missing.");
    }

    const familyEnumValue = familyType.getEnumValueByName(familyAttribute);
    if (familyEnumValue === null) {
      throw new Error(`Unknown packet family "${familyAttribute}"`);
    }

    const actionEnumValue = actionType.getEnumValueByName(actionAttribute);
    if (actionEnumValue === null) {
      throw new Error(`Unknown packet action "${actionAttribute}"`);
    }

    const objectCodeGenerator = new ObjectCodeGenerator(
      packetTypeName,
      this.typeFactory,
    );
    getInstructions(protocolPacket).forEach(
      objectCodeGenerator.generateInstruction,
      objectCodeGenerator,
    );

    const familyTsDoc = `/**
 * Returns the packet family associated with this type.
 *
 * @returns The packet family associated with this type
 */
`;

    const actionTsDoc = `/**
 * Returns the packet action associated with this type.
 *
 * @returns The packet action associated with this type
 */
`;

    const data = objectCodeGenerator.data;
    data.superInterfaces.push("Packet");
    data.addMethod(
      new CodeBlock()
        .add(familyTsDoc)
        .addLine("public static get family(): PacketFamily {")
        .indent()
        .addStatement(`return ${familyType.name}.${familyEnumValue.name}`)
        .unindent()
        .addLine("}")
        .addImportByType(familyType),
    );
    data.addMethod(
      new CodeBlock()
        .add(actionTsDoc)
        .addLine("public static get action(): PacketAction {")
        .indent()
        .addStatement(`return ${actionType.name}.${actionEnumValue.name}`)
        .unindent()
        .addLine("}")
        .addImportByType(actionType),
    );
    data.addMethod(
      new CodeBlock()
        .addLine("public get family(): PacketFamily {")
        .indent()
        .addStatement(`return ${packetTypeName}.family`)
        .unindent()
        .addLine("}"),
    );
    data.addMethod(
      new CodeBlock()
        .addLine("public get action(): PacketAction {")
        .indent()
        .addStatement(`return ${packetTypeName}.action`)
        .unindent()
        .addLine("}"),
    );
    data.addMethod(
      new CodeBlock()
        .addLine("public serialize(writer: EoWriter): void {")
        .indent()
        .addStatement(`${packetTypeName}.serialize(writer, this)`)
        .unindent()
        .addLine("}"),
    );

    const relativePath = path.posix.join(
      sourcePath,
      pascalCaseToKebabCase(packetTypeName),
    );
    this.exports.push(relativePath + ".js");

    return new TSFile(
      relativePath + ".ts",
      new CodeBlock()
        .addCodeBlock(generateTsDoc(getComment(protocolPacket)))
        .addCodeBlock(objectCodeGenerator.code),
    );
  }

  private static makePacketSuffix(path: string) {
    switch (path) {
      case "protocol/net/client":
        return "ClientPacket";
      case "protocol/net/server":
        return "ServerPacket";
      default:
        throw new Error(`Cannot create packet name suffix for path ${path}`);
    }
  }

  private generateIndex() {
    const codeBlock = new CodeBlock();
    this.exports.forEach((relativePath) => {
      codeBlock.addLine(
        `export * from "${path.posix.join("@eolib", relativePath)}"`,
      );
    });
    const generatedIndex = new TSFile("protocol/generated-index.ts", codeBlock);
    generatedIndex.write(this.outputRoot);
  }
}
