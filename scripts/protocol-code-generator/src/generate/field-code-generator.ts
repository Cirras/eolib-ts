import { BasicType, isBasicType } from "../type/basic-type";
import { BoolType } from "../type/bool-type";
import { isCustomType } from "../type/custom-type";
import { hasUnderlyingType } from "../type/has-underlying-type";
import { IntegerType } from "../type/integer-type";
import { Length } from "../type/length";
import { StringType } from "../type/string-type";
import { StructType } from "../type/struct-type";
import { Type } from "../type/type";
import { TypeFactory } from "../type/type-factory";
import { generateTsDoc } from "../util/doc-utils";
import { snakeCaseToCamelCase } from "../util/name-utils";
import { isInteger, tryParseInt } from "../util/number-utils";
import { CodeBlock } from "./code-block";
import {
  FieldData,
  ObjectGenerationContext,
  ObjectGenerationData,
} from "./object-code-generator";

class FieldCodeGenerator {
  private typeFactory: TypeFactory;
  private context: ObjectGenerationContext;
  private data: ObjectGenerationData;
  private name: string;
  private typeString: string;
  private lengthString: string;
  private optional: boolean;
  private padded: boolean;
  private hardcodedValue: string;
  private comment: string;
  private arrayField: boolean;
  private delimited: boolean;
  private trailingDelimiter: boolean;
  private lengthField: boolean;
  private offset: number;

  constructor(
    typeFactory: TypeFactory,
    context: ObjectGenerationContext,
    data: ObjectGenerationData,
    name: string,
    typeString: string,
    lengthString: string,
    padded: boolean,
    optional: boolean,
    hardcodedValue: string,
    comment: string,
    arrayField: boolean,
    delimited: boolean,
    trailingDelimiter: boolean,
    lengthField: boolean,
    offset: number
  ) {
    this.typeFactory = typeFactory;
    this.context = context;
    this.data = data;
    this.name = name;
    this.typeString = typeString;
    this.lengthString = lengthString;
    this.padded = padded;
    this.optional = optional;
    this.hardcodedValue = hardcodedValue;
    this.comment = comment;
    this.arrayField = arrayField;
    this.delimited = delimited;
    this.trailingDelimiter = trailingDelimiter;
    this.lengthField = lengthField;
    this.offset = offset;
    this.validate();
  }

  private validate(): void {
    this.validateSpecialFields();
    this.validateOptionalField();
    this.validateArrayField();
    this.validateLengthField();
    this.validateUnnamedField();
    this.validateHardcodedValue();
    this.validateUniqueName();
    this.validateLengthAttribute();
  }

  private validateSpecialFields(): void {
    if (this.arrayField && this.lengthField) {
      throw new Error(
        "A field cannot be both a length field and an array field."
      );
    }
  }

  private validateOptionalField(): void {
    if (!this.optional) {
      return;
    }

    if (this.name === null) {
      throw new Error("Optional fields must specify a name.");
    }
  }

  private validateArrayField(): void {
    if (this.arrayField) {
      if (this.name === null) {
        throw new Error("Array fields must specify a name.");
      }
      if (this.hardcodedValue) {
        throw new Error("Array fields may not specify hardcoded values.");
      }
      if (!this.delimited && !this.getType().bounded) {
        throw new Error(
          `Unbounded element type (${this.typeString}) forbidden in non-delimited array.`
        );
      }
    } else {
      if (this.delimited) {
        throw new Error("Only arrays can be delimited.");
      }
    }

    if (!this.delimited && this.trailingDelimiter) {
      throw new Error("Only delimited arrays can have a trailing delimiter.");
    }
  }

  private validateLengthField(): void {
    if (this.lengthField) {
      if (this.name === null) {
        throw new Error("Length fields must specify a name.");
      }
      if (this.hardcodedValue !== null) {
        throw new Error("Length fields may not specify hardcoded values.");
      }
      const type = this.getType();
      if (!(type instanceof IntegerType)) {
        throw new Error(
          `${type.name} is not a numeric type, so it is not allowed for a length field.`
        );
      }
    } else {
      if (this.offset !== 0) {
        throw new Error("Only length fields can have an offset.");
      }
    }
  }

  private validateUnnamedField(): void {
    if (this.name !== null) {
      return;
    }

    if (this.hardcodedValue === null) {
      throw new Error("Unnamed fields must specify a hardcoded field value.");
    }

    if (this.optional) {
      throw new Error("Unnamed fields may not be optional.");
    }
  }

  private validateHardcodedValue(): void {
    if (this.hardcodedValue === null) {
      return;
    }

    const type = this.getType();

    if (type instanceof StringType) {
      const length = tryParseInt(this.lengthString);
      if (length !== null && length !== this.hardcodedValue.length) {
        throw new Error(
          `Expected length of ${length} for hardcoded string value "${this.hardcodedValue}".`
        );
      }
    }

    if (!isBasicType(type)) {
      throw new Error(
        `Hardcoded field values are not allowed for ${type.name} fields (must be a basic type).`
      );
    }
  }

  private validateUniqueName(): void {
    if (this.name === null) {
      return;
    }

    if (this.context.accessibleFields.has(this.name)) {
      throw new Error(`Cannot redefine ${this.name} field.`);
    }
  }

  private validateLengthAttribute(): void {
    if (this.lengthString === null) {
      return;
    }

    if (
      !isInteger(this.lengthString) &&
      !this.context.lengthFieldIsReferencedMap.has(this.lengthString)
    ) {
      throw new Error(
        `Length attribute "${this.lengthString}" must be a numeric literal, or refer to a length field.`
      );
    }

    const isAlreadyReferenced = this.context.lengthFieldIsReferencedMap.get(
      this.lengthString
    );
    if (isAlreadyReferenced) {
      throw new Error(
        `Length field "${this.lengthString}" must not be referenced by multiple fields.`
      );
    }
  }

  public generateField(): void {
    if (this.name === null) {
      return;
    }

    const tsName = snakeCaseToCamelCase(this.name);
    const type = this.getType();

    let tsTypeName = this.getTsTypeName();
    if (this.arrayField) {
      tsTypeName = `${tsTypeName}[]`;
    }
    if (this.optional) {
      tsTypeName += " | null";
    }

    let initializer: string;
    if (this.hardcodedValue === null) {
      initializer = "null";
    } else if (type instanceof StringType) {
      initializer = `"${this.hardcodedValue}"`;
    } else {
      initializer = this.hardcodedValue;
    }

    this.context.accessibleFields.set(
      this.name,
      new FieldData(tsName, type, this.offset, this.arrayField)
    );

    this.data.fields.addLine(
      `private _${tsName}: ${tsTypeName} = ${initializer}`
    );

    if (isCustomType(type)) {
      this.data.fields.addImportByType(type);
    }

    if (this.lengthField) {
      this.context.lengthFieldIsReferencedMap.set(this.name, false);
      return;
    }

    const tsDoc = this.generateAccessorTsDoc();

    this.data.addMethod(
      new CodeBlock()
        .addCodeBlock(tsDoc)
        .addLine(`public get ${tsName}(): ${tsTypeName} {`)
        .indent()
        .addStatement(`return this._${tsName}`)
        .unindent()
        .addLine("}")
    );

    if (this.hardcodedValue === null) {
      const setter = new CodeBlock()
        .addCodeBlock(tsDoc)
        .addLine(`public set ${tsName}(${tsName}: ${tsTypeName}) {`)
        .indent()
        .addStatement(`this._${tsName} = ${tsName}`);

      if (this.context.lengthFieldIsReferencedMap.has(this.lengthString)) {
        this.context.lengthFieldIsReferencedMap.set(this.lengthString, true);
        const lengthFieldData = this.context.accessibleFields.get(
          this.lengthString
        );
        setter
          .beginControlFlow(`if (this._${tsName} !== null)`)
          .addStatement(
            `this._${lengthFieldData.tsName} = this._${tsName}.length`
          )
          .endControlFlow();
      }

      setter.unindent().addLine("}");

      this.data.addMethod(setter);
    }
  }

  private generateAccessorTsDoc(): CodeBlock {
    const notes = new Array<string>();

    if (this.lengthString !== null) {
      let sizeDescription: string;
      const fieldData = this.context.accessibleFields.get(this.lengthString);
      if (fieldData) {
        const maxValue =
          getMaxValueOf(fieldData.type as IntegerType) + fieldData.offset;
        sizeDescription = maxValue + " or less";
      } else {
        sizeDescription = "`" + this.lengthString + "`";
        if (this.padded) {
          sizeDescription += " or less";
        }
      }
      notes.push(`Length must be ${sizeDescription}.`);
    }

    const type = this.getType();
    if (type instanceof IntegerType) {
      const valueDescription = this.arrayField ? "Element value" : "Value";
      notes.push(`${valueDescription} range is 0-${getMaxValueOf(type)}`);
    }

    return generateTsDoc(this.comment, notes);
  }

  public generateSerialize(): void {
    this.generateSerializeNullOptionalGuard();
    this.generateSerializeNullNotAllowedError();
    this.generateSerializeLengthCheck();

    if (this.arrayField) {
      const tsName = snakeCaseToCamelCase(this.name);
      let arraySizeExpression = this.getLengthExpression();
      if (arraySizeExpression === null) {
        arraySizeExpression = `data._${tsName}.length`;
      }

      this.data.serialize.beginControlFlow(
        `for (let i = 0; i < ${arraySizeExpression}; ++i)`
      );

      if (this.delimited && !this.trailingDelimiter) {
        this.data.serialize
          .beginControlFlow("if (i > 0)")
          .addStatement("writer.addByte(0xFF)")
          .endControlFlow();
      }
    }

    this.data.serialize.addCodeBlock(this.getWriteStatement());

    if (this.arrayField) {
      if (this.delimited && this.trailingDelimiter) {
        this.data.serialize.addStatement("writer.addByte(0xFF)");
      }
      this.data.serialize.endControlFlow();
    }

    if (this.optional) {
      this.data.serialize.endControlFlow();
    }
  }

  private generateSerializeNullOptionalGuard(): void {
    if (!this.optional) {
      return;
    }

    const tsName = snakeCaseToCamelCase(this.name);
    if (this.context.reachedOptionalField) {
      this.data.serialize.addStatement(
        `reachedNullOptional = reachedNullOptional || data._${tsName} === null`
      );
    } else {
      this.data.serialize.addStatement(
        `let reachedNullOptional = data._${tsName} === null`
      );
    }
    this.data.serialize.beginControlFlow("if (!reachedNullOptional)");
  }

  private generateSerializeNullNotAllowedError(): void {
    if (this.optional || this.name === null || this.hardcodedValue !== null) {
      return;
    }

    const tsName = snakeCaseToCamelCase(this.name);
    this.data.serialize
      .beginControlFlow(`if (data._${tsName} === null)`)
      .addStatement(
        `throw new SerializationError("${tsName} must not be null.")`
      )
      .endControlFlow()
      .addImport("SerializationError", "protocol/serialization-error");
  }

  private generateSerializeLengthCheck(): void {
    if (this.name === null) {
      return;
    }

    let lengthExpression: string;

    const fieldData = this.context.accessibleFields.get(this.lengthString);
    if (fieldData) {
      lengthExpression = (
        getMaxValueOf(fieldData.type as IntegerType) + fieldData.offset
      ).toString();
    } else {
      lengthExpression = this.lengthString;
    }

    if (lengthExpression === null) {
      return;
    }

    const tsName = snakeCaseToCamelCase(this.name);
    const variableSize = this.padded || !!fieldData;
    const lengthCheckOperator = variableSize ? ">" : "!==";
    const expectedLengthDescription = variableSize
      ? `${lengthExpression} or less`
      : `exactly ${lengthExpression}`;

    const errorMessage =
      "Expected " +
      tsName +
      ".length to be " +
      expectedLengthDescription +
      ", got ${data." +
      tsName +
      ".length}.";

    this.data.serialize
      .beginControlFlow(
        `if (data._${tsName}.length ${lengthCheckOperator} ${lengthExpression})`
      )
      .addStatement(`throw new SerializationError(\`${errorMessage}\`)`)
      .endControlFlow()
      .addImport("SerializationError", "protocol/serialization-error");
  }

  private getWriteStatement(): CodeBlock {
    const realType = this.getType();
    let type = realType;

    if (hasUnderlyingType(type)) {
      type = type.underlyingType;
    }

    let valueExpression = this.getWriteValueExpression();
    if (realType instanceof BoolType) {
      valueExpression += " ? 1 : 0";
    }

    const offsetExpression = FieldCodeGenerator.getLengthOffsetExpression(
      -this.offset
    );
    if (offsetExpression !== null) {
      valueExpression += offsetExpression;
    }

    if (isBasicType(type)) {
      const lengthExpression = this.arrayField
        ? null
        : this.getLengthExpression();
      return new CodeBlock().addStatement(
        FieldCodeGenerator.getWriteStatementForBasicType(
          type,
          valueExpression,
          lengthExpression,
          this.padded
        )
      );
    } else if (type instanceof StructType) {
      return new CodeBlock()
        .addStatement(`${type.name}.serialize(writer, ${valueExpression})`)
        .addImportByType(type);
    } else {
      throw new Error("Unhandled Type");
    }
  }

  private getWriteValueExpression(): string {
    if (this.name === null) {
      const type = this.getType();
      if (type instanceof IntegerType) {
        if (isInteger(this.hardcodedValue)) {
          return this.hardcodedValue;
        }
        throw new Error(
          `"${this.hardcodedValue}" is not a valid integer value.`
        );
      } else if (type instanceof BoolType) {
        switch (this.hardcodedValue) {
          case "false":
            return "0";
          case "true":
            return "1";
          default:
            throw new Error(
              `"${this.hardcodedValue}" is not a valid bool value.`
            );
        }
      } else if (type instanceof StringType) {
        return `"${this.hardcodedValue}"`;
      } else {
        throw new Error("Unhandled BasicType");
      }
    } else {
      let fieldReference = "data._" + snakeCaseToCamelCase(this.name);
      if (this.arrayField) {
        fieldReference += "[i]";
      }
      return fieldReference;
    }
  }

  private static getWriteStatementForBasicType(
    type: BasicType,
    valueExpression: string,
    lengthExpression: string | null,
    padded: boolean
  ): string {
    switch (type.name) {
      case "byte":
        return `writer.addByte(${valueExpression})`;
      case "char":
        return `writer.addChar(${valueExpression})`;
      case "short":
        return `writer.addShort(${valueExpression})`;
      case "three":
        return `writer.addThree(${valueExpression})`;
      case "int":
        return `writer.addInt(${valueExpression})`;
      case "string":
        if (lengthExpression === null) {
          return `writer.addString(${valueExpression})`;
        } else {
          return `writer.addFixedString(${valueExpression}, ${lengthExpression}, ${padded})`;
        }
      case "encoded_string":
        if (lengthExpression === null) {
          return `writer.addEncodedString(${valueExpression})`;
        } else {
          return `writer.addFixedEncodedString(${valueExpression}, ${lengthExpression}, ${padded})`;
        }
      default:
        throw new Error("Unhandled BasicType");
    }
  }

  public generateDeserialize(): void {
    if (this.optional) {
      this.data.deserialize.beginControlFlow("if (reader.remaining > 0)");
    }

    if (this.arrayField) {
      this.generateDeserializeArray();
    } else {
      this.data.deserialize.addCodeBlock(this.getReadStatement());
    }

    if (this.optional) {
      this.data.deserialize.endControlFlow();
    }
  }

  private generateDeserializeArray(): void {
    const tsName = snakeCaseToCamelCase(this.name);
    let arrayLengthExpression = this.getLengthExpression();

    if (arrayLengthExpression === null && !this.delimited) {
      const elementSize = this.getType().fixedSize;
      if (elementSize !== null) {
        const arrayLengthVariableName = tsName + "Length";
        this.data.deserialize.addStatement(
          `const ${arrayLengthVariableName} = Math.trunc(reader.remaining / ${elementSize})`
        );
        arrayLengthExpression = arrayLengthVariableName;
      }
    }

    this.data.deserialize.addStatement(`data._${tsName} = []`);

    if (arrayLengthExpression === null) {
      this.data.deserialize.beginControlFlow("while (reader.remaining > 0)");
    } else {
      this.data.deserialize.beginControlFlow(
        `for (let i = 0; i < ${arrayLengthExpression}; ++i)`
      );
    }

    this.data.deserialize.addCodeBlock(this.getReadStatement());

    if (this.delimited) {
      const needsGuard =
        !this.trailingDelimiter && arrayLengthExpression !== null;
      if (needsGuard) {
        this.data.deserialize.beginControlFlow(
          `if (i + 1 < ${arrayLengthExpression})`
        );
      }

      this.data.deserialize.addStatement("reader.nextChunk()");

      if (needsGuard) {
        this.data.deserialize.endControlFlow();
      }
    }

    this.data.deserialize.endControlFlow();
  }

  private getReadStatement(): CodeBlock {
    const realType = this.getType();
    let type = realType;

    if (hasUnderlyingType(type)) {
      type = type.underlyingType;
    }

    const statement = new CodeBlock();

    if (this.arrayField) {
      const tsName = snakeCaseToCamelCase(this.name);
      statement.add(`data._${tsName}.push(`);
    } else if (this.name !== null) {
      const tsName = snakeCaseToCamelCase(this.name);
      statement.add(`data._${tsName} = `);
    }

    if (isBasicType(type)) {
      const lengthExpression = this.arrayField
        ? null
        : this.getLengthExpression();
      let readBasicType = FieldCodeGenerator.getReadStatementForBasicType(
        type,
        lengthExpression,
        this.padded
      );

      const offsetExpression = FieldCodeGenerator.getLengthOffsetExpression(
        this.offset
      );
      if (offsetExpression != null) {
        readBasicType += offsetExpression;
      }

      if (realType instanceof BoolType) {
        statement.add(`${readBasicType} !== 0`);
      } else {
        statement.add(readBasicType);
      }
    } else if (type instanceof StructType) {
      statement.add(`${type.name}.deserialize(reader)`).addImportByType(type);
    } else {
      throw new Error("Unhandled Type");
    }

    if (this.arrayField) {
      statement.add(")");
    }

    return statement.add(";\n");
  }

  private static getReadStatementForBasicType(
    type: BasicType,
    lengthExpression: string,
    padded: boolean
  ): string {
    switch (type.name) {
      case "byte":
        return "reader.getByte()";
      case "char":
        return "reader.getChar()";
      case "short":
        return "reader.getShort()";
      case "three":
        return "reader.getThree()";
      case "int":
        return "reader.getInt()";
      case "string":
        if (lengthExpression === null) {
          return "reader.getString()";
        } else {
          return `reader.getFixedString(${lengthExpression}, ${padded})`;
        }
      case "encoded_string":
        if (lengthExpression === null) {
          return "reader.getEncodedString()";
        } else {
          return `reader.getFixedEncodedString(${lengthExpression}, ${padded})`;
        }
      default:
        throw new Error("Unhandled BasicType");
    }
  }

  private getType(): Type {
    return this.typeFactory.getType(this.typeString, this.getTypeLength());
  }

  private getTypeLength(): Length {
    if (this.arrayField) {
      return Length.unspecified();
    }

    if (this.lengthString !== null) {
      return Length.fromString(this.lengthString);
    }

    return Length.unspecified();
  }

  private getTsTypeName(): string {
    const type = this.getType();
    if (type instanceof IntegerType) {
      return "number";
    } else if (type instanceof StringType) {
      return "string";
    } else if (type instanceof BoolType) {
      return "boolean";
    } else if (isCustomType(type)) {
      return type.name;
    } else {
      throw new Error("Unhandled Type");
    }
  }

  private getLengthExpression(): string {
    if (this.lengthString === null) {
      return null;
    }
    let expression = this.lengthString;
    if (!isInteger(expression)) {
      const fieldData = this.context.accessibleFields.get(expression);
      if (!fieldData) {
        throw new Error(`Referenced ${expression} field is not accessible.`);
      }
      expression = `data._${fieldData.tsName}`;
    }
    return expression;
  }

  private static getLengthOffsetExpression(offset: number): string {
    if (offset !== 0) {
      return ` ${offset > 0 ? "+" : "-"} ${Math.abs(offset)}`;
    }
    return null;
  }
}

export class FieldCodeGeneratorBuilder {
  private readonly typeFactory: TypeFactory;
  private readonly context: ObjectGenerationContext;
  private readonly data: ObjectGenerationData;
  private _name: string = null;
  private _type: string = null;
  private _length: string = null;
  private _offset: number = 0;
  private _padded: boolean = false;
  private _optional: boolean = false;
  private _hardcodedValue: string = null;
  private _comment: string = null;
  private _arrayField: boolean = false;
  private _lengthField: boolean = false;
  private _delimited: boolean = false;
  private _trailingDelimiter: boolean = false;

  constructor(
    typeFactory: TypeFactory,
    context: ObjectGenerationContext,
    data: ObjectGenerationData
  ) {
    this.typeFactory = typeFactory;
    this.context = context;
    this.data = data;
  }

  public name(name: string): this {
    this._name = name;
    return this;
  }

  public type(type: string): this {
    this._type = type;
    return this;
  }

  public length(length: string): this {
    this._length = length;
    return this;
  }

  public padded(padded: boolean): this {
    this._padded = padded;
    return this;
  }

  public optional(optional: boolean): this {
    this._optional = optional;
    return this;
  }

  public hardcodedValue(hardcodedValue: string): this {
    this._hardcodedValue = hardcodedValue;
    return this;
  }

  public comment(comment: string): this {
    this._comment = comment;
    return this;
  }

  public arrayField(arrayField: boolean): this {
    this._arrayField = arrayField;
    return this;
  }

  public delimited(delimited: boolean): this {
    this._delimited = delimited;
    return this;
  }

  public trailingDelimiter(trailingDelimiter: boolean): this {
    this._trailingDelimiter = trailingDelimiter;
    return this;
  }

  public lengthField(lengthField: boolean): this {
    this._lengthField = lengthField;
    return this;
  }

  public offset(offset: number): this {
    this._offset = offset;
    return this;
  }

  public build(): FieldCodeGenerator {
    if (this.type === null) {
      throw new Error("type must be provided");
    }
    return new FieldCodeGenerator(
      this.typeFactory,
      this.context,
      this.data,
      this._name,
      this._type,
      this._length,
      this._padded,
      this._optional,
      this._hardcodedValue,
      this._comment,
      this._arrayField,
      this._delimited,
      this._trailingDelimiter,
      this._lengthField,
      this._offset
    );
  }
}

function getMaxValueOf(type: IntegerType): number {
  return type.name === "byte" ? 255 : Math.pow(253, type.fixedSize) - 1;
}
