import { XmlElement } from "@rgrove/parse-xml";

import { Type } from "./type";
import { EnumType, EnumValue } from "./enum-type";
import { StructType } from "./struct-type";
import { hasUnderlyingType } from "./has-underlying-type";
import { Length } from "./length";
import { IntegerType } from "./integer-type";
import { BoolType } from "./bool-type";
import { StringType } from "./string-type";
import {
  getBooleanAttribute,
  getInstructions,
  getRequiredStringAttribute,
  getStringAttribute,
  getText,
} from "../util/xml-utils";
import { tryParseInt } from "../util/number-utils";

export class TypeFactory {
  private readonly unresolvedTypes: Map<string, UnresolvedCustomType>;
  private readonly types: Map<string, Type>;

  public constructor() {
    this.unresolvedTypes = new Map();
    this.types = new Map();
  }

  public getType(name: string, length: Length = Length.unspecified()): Type {
    if (length.specified) {
      return TypeFactory.createTypeWithSpecifiedLength(name, length);
    }
    if (!this.types.has(name)) {
      this.types.set(name, this.createType(name, length));
    }
    return this.types.get(name);
  }

  public defineCustomType(
    protocolType: XmlElement,
    sourcePath: string
  ): boolean {
    const name = getRequiredStringAttribute(protocolType, "name");
    if (this.unresolvedTypes.has(name)) {
      return false;
    }
    this.unresolvedTypes.set(
      name,
      new UnresolvedCustomType(protocolType, sourcePath)
    );
    return true;
  }

  public clear(): void {
    this.unresolvedTypes.clear();
    this.types.clear();
  }

  private createType(name: string, length: Length): Type {
    let underlyingType: IntegerType = this.readUnderlyingType(name);
    if (underlyingType !== null) {
      name = name.substring(0, name.indexOf(":"));
    }

    let result: Type;

    switch (name) {
      case "byte":
      case "char":
        result = new IntegerType(name, 1);
        break;
      case "short":
        result = new IntegerType(name, 2);
        break;
      case "three":
        result = new IntegerType(name, 3);
        break;
      case "int":
        result = new IntegerType(name, 4);
        break;
      case "bool":
        if (underlyingType === null) {
          underlyingType = this.getType("char") as IntegerType;
        }
        result = new BoolType(underlyingType);
        break;
      case "string":
      case "encoded_string":
        result = new StringType(name, length);
        break;
      default:
        result = this.createCustomType(name, underlyingType);
        break;
    }

    if (underlyingType !== null && !hasUnderlyingType(result)) {
      throw new Error(
        `${result.name} has no underlying type, ` +
          `so ${underlyingType.name} is not allowed as an underlying type override.`
      );
    }

    return result;
  }

  private readUnderlyingType(name: string): IntegerType | null {
    const parts = name.split(":");

    switch (parts.length) {
      case 1:
        return null;

      case 2:
        const typeName: string = parts[0];
        const underlyingTypeName: string = parts[1];
        if (typeName === underlyingTypeName) {
          throw new Error(
            `${typeName} type cannot specify itself as an underlying type.`
          );
        }
        const underlyingType = this.getType(underlyingTypeName);
        if (!(underlyingType instanceof IntegerType)) {
          throw new Error(
            `${underlyingType.name} is not a numeric type, ` +
              `so it cannot be specified as an underlying type.`
          );
        }
        return underlyingType;

      default:
        throw new Error(
          `"${name}" type syntax is invalid. (Only one colon is allowed)`
        );
    }
  }

  private createCustomType(
    name: string,
    underlyingTypeOverride: IntegerType
  ): Type {
    const unresolvedType = this.unresolvedTypes.get(name);
    if (!unresolvedType) {
      throw new Error(`${name} type is not defined.`);
    }

    switch (unresolvedType.typeXml.name) {
      case "enum":
        return this.createEnumType(
          unresolvedType.typeXml,
          underlyingTypeOverride,
          unresolvedType.relativePath
        );
      case "struct":
        return this.createStructType(
          unresolvedType.typeXml,
          unresolvedType.relativePath
        );
      default:
        throw new Error(
          `Unhandled CustomType xml element: <${unresolvedType.typeXml.name}>`
        );
    }
  }

  private createEnumType(
    protocolEnum: XmlElement,
    underlyingTypeOverride: IntegerType | null,
    relativePath: string
  ): Type {
    let underlyingType = underlyingTypeOverride;
    const enumName = getRequiredStringAttribute(protocolEnum, "name");

    if (!underlyingType) {
      const underlyingTypeName = getRequiredStringAttribute(
        protocolEnum,
        "type"
      );
      if (enumName === underlyingTypeName) {
        throw new Error(
          `${protocolEnum.name} type cannot specify itself as an underlying type.`
        );
      }

      const defaultUnderlyingType = this.getType(underlyingTypeName);
      if (!(defaultUnderlyingType instanceof IntegerType)) {
        throw new Error(
          `${defaultUnderlyingType.name} is not a numeric type, ` +
            `so it cannot be specified as an underlying type.`
        );
      }

      underlyingType = defaultUnderlyingType;
    }

    const protocolValues = protocolEnum.children.filter(
      (child) => child instanceof XmlElement && child.name === "value"
    ) as Array<XmlElement>;

    const values = new Array<EnumValue>();
    const ordinals = new Set<number>();
    const names = new Set<string>();

    for (const protocolValue of protocolValues) {
      const ordinal = tryParseInt(getText(protocolValue));
      const valueName = getRequiredStringAttribute(protocolValue, "name");

      if (ordinal === null) {
        throw new Error(
          `${enumName}.${valueName} has invalid ordinal value \"${getText(
            protocolValue
          )}\"`
        );
      }

      if (!ordinals.has(ordinal)) {
        ordinals.add(ordinal);
      } else {
        throw new Error(
          `${enumName}.${valueName} cannot redefine ordinal value ${ordinal}.`
        );
      }

      if (!names.has(valueName)) {
        names.add(valueName);
      } else {
        throw new Error(
          `${enumName} enum cannot redefine value name ${valueName}.`
        );
      }

      values.push(new EnumValue(ordinal, valueName));
    }

    return new EnumType(enumName, relativePath, underlyingType, values);
  }

  private createStructType(
    protocolStruct: XmlElement,
    relativePath: string
  ): Type {
    return new StructType(
      getRequiredStringAttribute(protocolStruct, "name"),
      this.calculateFixedStructSize(protocolStruct),
      this.isBounded(protocolStruct),
      relativePath
    );
  }

  private calculateFixedStructSize(protocolStruct: XmlElement): number | null {
    let size = 0;

    for (const instruction of getInstructions(protocolStruct)) {
      let instructionSize: number | null = 0;

      switch (instruction.name) {
        case "field":
          instructionSize = this.calculateFixedStructFieldSize(instruction);
          break;
        case "array":
          instructionSize = this.calculateFixedStructArraySize(instruction);
          break;
        case "dummy":
          instructionSize = this.calculateFixedStructDummySize(instruction);
          break;
        case "chunked":
          // Chunked reading is not allowed in fixed-size structs
          // It's possible to omit data or insert garbage data at the end of each chunk
          instructionSize = null;
          break;
        case "switch":
          // Switch sections are not allowed in fixed-sized structs
          instructionSize = null;
          break;
      }

      if (instructionSize === null) {
        return null;
      }

      size += instructionSize;
    }

    return size;
  }

  private calculateFixedStructFieldSize(
    protocolField: XmlElement
  ): number | null {
    const type = this.getType(
      getRequiredStringAttribute(protocolField, "type"),
      TypeFactory.createTypeLengthForField(protocolField)
    );
    const fieldSize = type.fixedSize;
    if (fieldSize === null) {
      // All fields in a fixed-size struct must also be fixed-size
      return null;
    }

    if (getBooleanAttribute(protocolField, "optional")) {
      // Nothing can be optional in a fixed-size struct
      return null;
    }

    return fieldSize;
  }

  private calculateFixedStructArraySize(
    protocolArray: XmlElement
  ): number | null {
    const length = tryParseInt(getStringAttribute(protocolArray, "length"));
    if (length === null) {
      // An array cannot be fixed-size unless a numeric length attribute is provided
      return null;
    }

    const type = this.getType(
      getRequiredStringAttribute(protocolArray, "type")
    );
    const elementSize = type.fixedSize;
    if (elementSize === null) {
      // An array cannot be fixed-size unless its elements are also fixed-size
      // All arrays in a fixed-size struct must also be fixed-size
      return null;
    }

    if (getBooleanAttribute(protocolArray, "optional")) {
      // Nothing can be optional in a fixed-size struct
      return null;
    }

    if (getBooleanAttribute(protocolArray, "delimited")) {
      // It's possible to omit data or insert garbage data at the end of each chunk
      return null;
    }

    return length * elementSize;
  }

  private calculateFixedStructDummySize(
    protocolDummy: XmlElement
  ): number | null {
    const type = this.getType(
      getRequiredStringAttribute(protocolDummy, "type")
    );

    const dummySize = type.fixedSize;
    if (dummySize === null) {
      // All dummy fields in a fixed-size struct must also be fixed-size
      return null;
    }

    return dummySize;
  }

  private isBounded(protocolStruct: XmlElement): boolean {
    let result = true;

    for (const instruction of TypeFactory.flattenInstructions(protocolStruct)) {
      if (!result) {
        result = instruction.name === "break";
        continue;
      }

      switch (instruction.name) {
        case "field":
          const fieldType = this.getType(
            getRequiredStringAttribute(instruction, "type"),
            TypeFactory.createTypeLengthForField(instruction)
          );
          result = fieldType.bounded;
          break;
        case "array":
          const elementType = this.getType(
            getRequiredStringAttribute(instruction, "type")
          );
          result =
            elementType.bounded &&
            getStringAttribute(instruction, "length") !== null;
          break;
        case "dummy":
          const dummyType = this.getType(
            getRequiredStringAttribute(instruction, "type")
          );
          result = dummyType.bounded;
          break;
      }
    }

    return result;
  }

  private static flattenInstructions(
    element: XmlElement,
    result: XmlElement[] = []
  ): XmlElement[] {
    for (const instruction of getInstructions(element)) {
      result.push(instruction);
      if (instruction.name === "chunked") {
        for (const chunkedInstruction of getInstructions(instruction)) {
          TypeFactory.flattenInstructions(chunkedInstruction, result);
        }
      } else if (instruction.name === "switch") {
        const protocolCases = instruction.children.filter(
          (child) => child instanceof XmlElement && child.name === "case"
        ) as Array<XmlElement>;
        for (const protocolCase of protocolCases) {
          for (const caseInstruction of getInstructions(protocolCase)) {
            TypeFactory.flattenInstructions(caseInstruction, result);
          }
        }
      }
    }
    return result;
  }

  private static createTypeLengthForField(protocolField: XmlElement): Length {
    const lengthString = getStringAttribute(protocolField, "length");
    if (lengthString !== null) {
      return Length.fromString(lengthString);
    } else {
      return Length.unspecified();
    }
  }

  private static createTypeWithSpecifiedLength(
    name: string,
    length: Length
  ): Type {
    switch (name) {
      case "string":
      case "encoded_string":
        return new StringType(name, length);
      default:
        throw new Error(
          `${name} type with length ${length} is invalid. (Only string types may specify a length)`
        );
    }
  }
}

class UnresolvedCustomType {
  private readonly _typeXml: XmlElement;
  private readonly _relativePath: string;

  public constructor(typeXml: XmlElement, relativePath: string) {
    this._typeXml = typeXml;
    this._relativePath = relativePath;
  }

  public get typeXml(): XmlElement {
    return this._typeXml;
  }

  public get relativePath(): string {
    return this._relativePath;
  }
}
