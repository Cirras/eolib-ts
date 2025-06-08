import { XmlElement } from "@rgrove/parse-xml";

import { Type } from "../type/type";
import { TypeFactory } from "../type/type-factory";
import { FieldCodeGeneratorBuilder } from "./field-code-generator";
import { SwitchCodeGenerator } from "./switch-code-generator";
import { CodeBlock } from "./code-block";
import {
  getBooleanAttribute,
  getComment,
  getInstructions,
  getIntAttribute,
  getRequiredStringAttribute,
  getStringAttribute,
  getText,
} from "../util/xml-utils";

export class ObjectCodeGenerator {
  private readonly typeFactory: TypeFactory;
  private readonly context: ObjectGenerationContext;
  private readonly _data: ObjectGenerationData;

  public constructor(
    className: string,
    typeFactory: TypeFactory,
    context = new ObjectGenerationContext(),
  ) {
    this.typeFactory = typeFactory;
    this.context = context;
    this._data = new ObjectGenerationData(className);
  }

  public generateInstruction(instruction: XmlElement): void {
    if (this.context.reachedDummy) {
      throw new Error(
        "<dummy> elements must not be followed by any other elements.",
      );
    }
    switch (instruction.name) {
      case "field":
        this.generateField(instruction);
        break;
      case "array":
        this.generateArray(instruction);
        break;
      case "length":
        this.generateLength(instruction);
        break;
      case "dummy":
        this.generateDummy(instruction);
        break;
      case "switch":
        this.generateSwitch(instruction);
        break;
      case "chunked":
        this.generateChunked(instruction);
        break;
      case "break":
        this.generateBreak();
        break;
    }
  }

  public get data(): ObjectGenerationData {
    return this._data;
  }

  public get code(): CodeBlock {
    const result = new CodeBlock()
      .addLine(`export class ${this.data.className} {`)
      .indent()
      .addLine("private _byteSize: number = 0;")
      .addCodeBlock(this.data.fields)
      .addLine()
      .addCodeBlock(this.generateGetByteSize())
      .addLine()
      .addCodeBlock(this.data.methods)
      .addLine()
      .addCodeBlock(this.generateSerializeMethod())
      .addLine()
      .addCodeBlock(this.generateDeserializeMethod())
      .unindent()
      .addLine("}");

    if (!this.data.auxillaryTypes.empty) {
      result
        .addLine()
        .addLine(`export namespace ${this.data.className} {`)
        .indent()
        .addCodeBlock(this.data.auxillaryTypes)
        .unindent()
        .addStatement("}");
    }

    return result;
  }

  private generateGetByteSize(): CodeBlock {
    const tsDoc = `/**
 * Returns the size of the data that this was deserialized from.
 *
 * @returns The size of the data that this was deserialized from
 */
`;

    return new CodeBlock()
      .add(tsDoc)
      .addLine(`public get byteSize() {`)
      .indent()
      .addStatement("return this._byteSize")
      .unindent()
      .addLine("}");
  }

  private generateSerializeMethod(): CodeBlock {
    const className = this.data.className;
    const tsDoc = `/**
 * Serializes an instance of \`${className}\` to the provided \`EoWriter\`.
 *
 * @param writer - the writer that the data will be serialized to
 * @param data - the data to serialize
 */
`;

    const result: CodeBlock = new CodeBlock()
      .add(tsDoc)
      .addLine(
        `public static serialize(writer: EoWriter, data: ${className}): void {`,
      )
      .indent();

    if (this.context.needsOldWriterLengthVariable) {
      result.addStatement("const oldWriterLength = writer.length");
    }

    return result
      .addStatement(
        "const oldStringSanitizationMode = writer.stringSanitizationMode",
      )
      .beginControlFlow("try")
      .addCodeBlock(this.data.serialize)
      .nextControlFlow("finally")
      .addStatement("writer.stringSanitizationMode = oldStringSanitizationMode")
      .endControlFlow()
      .unindent()
      .addLine("}")
      .addImport("EoWriter", "data/eo-writer.js");
  }

  private generateDeserializeMethod(): CodeBlock {
    const className = this.data.className;
    const tsDoc = `/**
 * Deserializes an instance of \`${className}\` from the provided \`EoReader\`.
 *
 * @param reader - the reader that the data will be deserialized from
 * @returns The deserialized data
 */
`;

    return new CodeBlock()
      .add(tsDoc)
      .addLine(`public static deserialize(reader: EoReader): ${className} {`)
      .indent()
      .addStatement(`const data: ${className} = new ${className}()`)
      .addStatement("const oldChunkedReadingMode = reader.chunkedReadingMode")
      .beginControlFlow("try")
      .addStatement("const readerStartPosition = reader.position")
      .addCodeBlock(this.data.deserialize)
      .addStatement("data._byteSize = reader.position - readerStartPosition")
      .addStatement("return data")
      .nextControlFlow("finally")
      .addStatement("reader.chunkedReadingMode = oldChunkedReadingMode")
      .endControlFlow()
      .unindent()
      .addLine("}")
      .addImport("EoReader", "data/eo-reader.js");
  }

  private generateField(protocolField: XmlElement): void {
    const optional = getBooleanAttribute(protocolField, "optional");
    this.checkOptionalField(optional);

    const fieldCodeGenerator = this.fieldCodeGeneratorBuilder()
      .name(getStringAttribute(protocolField, "name"))
      .type(getRequiredStringAttribute(protocolField, "type"))
      .length(getStringAttribute(protocolField, "length"))
      .padded(getBooleanAttribute(protocolField, "padded"))
      .optional(optional)
      .hardcodedValue(getText(protocolField))
      .comment(getComment(protocolField))
      .build();

    fieldCodeGenerator.generateField();
    fieldCodeGenerator.generateSerialize();
    fieldCodeGenerator.generateDeserialize();

    if (optional) {
      this.context.reachedOptionalField = true;
    }
  }

  private generateArray(protocolArray: XmlElement): void {
    const optional = getBooleanAttribute(protocolArray, "optional");
    this.checkOptionalField(optional);

    const delimited = getBooleanAttribute(protocolArray, "delimited");
    if (delimited && !this.context.chunkedReadingEnabled) {
      throw new Error(
        "Cannot generate a delimited array instruction unless chunked reading is enabled." +
          " (All delimited <array> elements must be within <chunked> sections.)",
      );
    }

    const fieldCodeGenerator = this.fieldCodeGeneratorBuilder()
      .name(getRequiredStringAttribute(protocolArray, "name"))
      .type(getRequiredStringAttribute(protocolArray, "type"))
      .length(getStringAttribute(protocolArray, "length"))
      .optional(optional)
      .comment(getComment(protocolArray))
      .arrayField(true)
      .delimited(delimited)
      .trailingDelimiter(
        getBooleanAttribute(protocolArray, "trailing-delimiter", true),
      )
      .build();

    fieldCodeGenerator.generateField();
    fieldCodeGenerator.generateSerialize();
    fieldCodeGenerator.generateDeserialize();

    if (optional) {
      this.context.reachedOptionalField = true;
    }
  }

  private generateLength(protocolLength: XmlElement): void {
    const optional = getBooleanAttribute(protocolLength, "optional");
    this.checkOptionalField(optional);

    const fieldCodeGenerator = this.fieldCodeGeneratorBuilder()
      .name(getRequiredStringAttribute(protocolLength, "name"))
      .type(getRequiredStringAttribute(protocolLength, "type"))
      .offset(getIntAttribute(protocolLength, "offset"))
      .lengthField(true)
      .optional(optional)
      .comment(getComment(protocolLength))
      .build();

    fieldCodeGenerator.generateField();
    fieldCodeGenerator.generateSerialize();
    fieldCodeGenerator.generateDeserialize();

    if (optional) {
      this.context.reachedOptionalField = true;
    }
  }

  private generateDummy(protocolDummy: XmlElement): void {
    const fieldCodeGenerator = this.fieldCodeGeneratorBuilder()
      .type(getRequiredStringAttribute(protocolDummy, "type"))
      .hardcodedValue(getText(protocolDummy))
      .comment(getComment(protocolDummy))
      .build();

    const needsIfGuards =
      this.data.serialize.empty || this.data.deserialize.empty;

    if (needsIfGuards) {
      this.data.serialize.beginControlFlow(
        "if (writer.length === oldWriterLength)",
      );
      this.data.deserialize.beginControlFlow(
        "if (reader.position === readerStartPosition)",
      );
    }

    fieldCodeGenerator.generateSerialize();
    fieldCodeGenerator.generateDeserialize();

    if (needsIfGuards) {
      this.data.serialize.endControlFlow();
      this.data.deserialize.endControlFlow();
    }

    this.context.reachedDummy = true;
    if (needsIfGuards) {
      this.context.needsOldWriterLengthVariable = true;
    }
  }

  private fieldCodeGeneratorBuilder(): FieldCodeGeneratorBuilder {
    return new FieldCodeGeneratorBuilder(
      this.typeFactory,
      this.context,
      this.data,
    );
  }

  private checkOptionalField(optional: boolean): void {
    if (this.context.reachedOptionalField && !optional) {
      throw new Error(
        "Optional fields may not be followed by non-optional fields.",
      );
    }
  }

  private generateSwitch(protocolSwitch: XmlElement): void {
    const switchCodeGenerator = new SwitchCodeGenerator(
      getRequiredStringAttribute(protocolSwitch, "field"),
      this.typeFactory,
      this.context,
      this.data,
    );

    const protocolCases: XmlElement[] = protocolSwitch.children
      .filter((child) => child instanceof XmlElement)
      .map((child) => child as XmlElement)
      .filter((child) => child.name === "case");

    switchCodeGenerator.generateCaseDataInterface(protocolCases);
    switchCodeGenerator.generateCaseDataField();
    switchCodeGenerator.generateSwitchStart();

    let reachedOptionalField = this.context.reachedOptionalField;
    let reachedDummy = this.context.reachedDummy;

    protocolCases.forEach((protocolCase) => {
      const caseContext = switchCodeGenerator.generateCase(protocolCase);

      reachedOptionalField =
        reachedOptionalField || caseContext.reachedOptionalField;
      reachedDummy = reachedDummy || caseContext.reachedDummy;
    });

    this.context.reachedOptionalField = reachedOptionalField;
    this.context.reachedDummy = reachedDummy;

    switchCodeGenerator.generateSwitchEnd();
  }

  private generateChunked(protocolChunked: XmlElement): void {
    const wasAlreadyEnabled = this.context.chunkedReadingEnabled;
    if (!wasAlreadyEnabled) {
      this.context.chunkedReadingEnabled = true;
      this.data.deserialize.addStatement("reader.chunkedReadingMode = true");
      this.data.serialize.addStatement("writer.stringSanitizationMode = true");
    }

    getInstructions(protocolChunked).forEach(this.generateInstruction, this);

    if (!wasAlreadyEnabled) {
      this.context.chunkedReadingEnabled = false;
      this.data.deserialize.addStatement("reader.chunkedReadingMode = false");
      this.data.serialize.addStatement("writer.stringSanitizationMode = false");
    }
  }

  private generateBreak(): void {
    if (!this.context.chunkedReadingEnabled) {
      throw new Error(
        "Cannot generate a break instruction unless chunked reading is enabled." +
          " (All <break> elements must be within <chunked> sections.)",
      );
    }

    this.context.reachedOptionalField = false;
    this.context.reachedDummy = false;

    this.data.serialize.addStatement("writer.addByte(0xFF)");
    this.data.deserialize.addStatement("reader.nextChunk()");
  }
}

export class FieldData {
  private readonly _tsName: string;
  private readonly _type: Type;
  private readonly _offset: number;
  private readonly _array: boolean;

  public constructor(
    tsName: string,
    type: Type,
    offset: number,
    array: boolean,
  ) {
    this._tsName = tsName;
    this._type = type;
    this._offset = offset;
    this._array = array;
  }

  public get tsName(): string {
    return this._tsName;
  }

  public get type() {
    return this._type;
  }

  public get offset(): number {
    return this._offset;
  }

  public get array(): boolean {
    return this._array;
  }
}

export class ObjectGenerationContext {
  private _chunkedReadingEnabled: boolean;
  private _reachedOptionalField: boolean;
  private _reachedDummy: boolean;
  private _needsOldWriterLengthVariable: boolean;
  private _accessibleFields: Map<string, FieldData>;
  private _lengthFieldIsReferencedMap: Map<string, boolean>;

  public constructor() {
    this._chunkedReadingEnabled = false;
    this._reachedOptionalField = false;
    this._reachedDummy = false;
    this._needsOldWriterLengthVariable = false;
    this._accessibleFields = new Map();
    this._lengthFieldIsReferencedMap = new Map();
  }

  public copy(): ObjectGenerationContext {
    const result = new ObjectGenerationContext();
    result._chunkedReadingEnabled = this._chunkedReadingEnabled;
    result._reachedOptionalField = this._reachedOptionalField;
    result._reachedDummy = this._reachedDummy;
    result._needsOldWriterLengthVariable = this._needsOldWriterLengthVariable;
    result._accessibleFields = new Map(this._accessibleFields);
    result._lengthFieldIsReferencedMap = new Map(
      this._lengthFieldIsReferencedMap,
    );
    return result;
  }

  public get chunkedReadingEnabled(): boolean {
    return this._chunkedReadingEnabled;
  }

  public get reachedOptionalField(): boolean {
    return this._reachedOptionalField;
  }

  public get reachedDummy(): boolean {
    return this._reachedDummy;
  }

  public get needsOldWriterLengthVariable(): boolean {
    return this._needsOldWriterLengthVariable;
  }

  public get accessibleFields(): Map<string, FieldData> {
    return this._accessibleFields;
  }

  public get lengthFieldIsReferencedMap(): Map<string, boolean> {
    return this._lengthFieldIsReferencedMap;
  }

  public set chunkedReadingEnabled(chunkedReadingEnabled: boolean) {
    this._chunkedReadingEnabled = chunkedReadingEnabled;
  }

  public set reachedOptionalField(reachedOptionalField: boolean) {
    this._reachedOptionalField = reachedOptionalField;
  }

  public set reachedDummy(reachedDummy: boolean) {
    this._reachedDummy = reachedDummy;
  }

  public set needsOldWriterLengthVariable(
    needsOldWriterLengthVariable: boolean,
  ) {
    this._needsOldWriterLengthVariable = needsOldWriterLengthVariable;
  }
}

export class ObjectGenerationData {
  private readonly _className: string;
  private readonly _superInterfaces: string[];
  private readonly _fields: CodeBlock;
  private readonly _methods: CodeBlock;
  private readonly _serialize: CodeBlock;
  private readonly _deserialize: CodeBlock;
  private readonly _auxillaryTypes: CodeBlock;

  constructor(className: string) {
    this._className = className;
    this._superInterfaces = [];
    this._fields = new CodeBlock();
    this._methods = new CodeBlock();
    this._serialize = new CodeBlock();
    this._deserialize = new CodeBlock();
    this._auxillaryTypes = new CodeBlock();
  }

  public get className(): string {
    return this._className;
  }

  public get superInterfaces(): string[] {
    return this._superInterfaces;
  }

  public get fields(): CodeBlock {
    return this._fields;
  }

  public get methods(): CodeBlock {
    return this._methods;
  }

  public get serialize(): CodeBlock {
    return this._serialize;
  }

  public get deserialize(): CodeBlock {
    return this._deserialize;
  }

  public get auxillaryTypes(): CodeBlock {
    return this._auxillaryTypes;
  }

  public addMethod(method: CodeBlock): void {
    if (!this.methods.empty) {
      this.methods.addLine();
    }
    this.methods.addCodeBlock(method);
  }

  public addAuxillaryType(type: CodeBlock): void {
    if (!this.auxillaryTypes.empty) {
      this.auxillaryTypes.addLine();
    }
    this.auxillaryTypes.addCodeBlock(type);
  }
}
