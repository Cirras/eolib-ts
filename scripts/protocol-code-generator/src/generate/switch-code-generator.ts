import { XmlElement } from "@rgrove/parse-xml";
import { EnumType } from "../type/enum-type";
import { IntegerType } from "../type/integer-type";
import { TypeFactory } from "../type/type-factory";
import { CodeBlock } from "./code-block";
import {
  FieldData,
  ObjectCodeGenerator,
  ObjectGenerationContext,
  ObjectGenerationData,
} from "./object-code-generator";
import { generateTsDoc } from "../util/doc-utils";
import { snakeCaseToPascalCase } from "../util/name-utils";
import { isInteger, tryParseInt } from "../util/number-utils";
import {
  getComment,
  getInstructions,
  getBooleanAttribute,
  getRequiredStringAttribute,
} from "../util/xml-utils";

export class SwitchCodeGenerator {
  private readonly fieldName: string;
  private readonly typeFactory: TypeFactory;
  private readonly context: ObjectGenerationContext;
  private readonly data: ObjectGenerationData;

  public constructor(
    fieldName: string,
    typeFactory: TypeFactory,
    context: ObjectGenerationContext,
    data: ObjectGenerationData,
  ) {
    this.fieldName = fieldName;
    this.typeFactory = typeFactory;
    this.context = context;
    this.data = data;
  }

  public generateCaseDataInterface(protocolCases: XmlElement[]): void {
    const unionTypeNames = protocolCases
      .filter((protocolCase) => getInstructions(protocolCase).length > 0)
      .map((protocolCase) => this.getCaseDataTypeName(protocolCase));
    unionTypeNames.push("null");

    const unionType = unionTypeNames.join(" | ");
    const fieldName = this.getFieldData().tsName;
    const tsDoc = `/**
 * Data associated with different values of the \`${fieldName}\` field
 */
`;

    this.data.addAuxillaryType(
      new CodeBlock()
        .add(tsDoc)
        .addLine(`export type ${this.getInterfaceTypeName()} = ${unionType};`),
    );
  }

  public generateCaseDataField(): void {
    const interfaceTypeName =
      this.data.className + "." + this.getInterfaceTypeName();
    const caseDataFieldName = this.getCaseDataFieldName();
    const switchFieldName = this.getFieldData().tsName;

    this.data.fields.addLine(
      `private _${caseDataFieldName}: ${interfaceTypeName};`,
    );

    const getterTsDoc = `/**
 * Returns data associated with the \`${switchFieldName}\` field.
 *
 * @returns Data associated with the \`${switchFieldName}\` field
 *
 */
`;

    this.data.addMethod(
      new CodeBlock()
        .add(getterTsDoc)
        .addLine(`public get ${caseDataFieldName}(): ${interfaceTypeName} {`)
        .indent()
        .addStatement(`return this._${caseDataFieldName}`)
        .unindent()
        .addLine("}"),
    );

    const setterTsDoc = `/**
 * Sets data associated with the \`${switchFieldName}\` field.
 *
 * @param ${caseDataFieldName} - the new \`${caseDataFieldName}\`
 *
 */
`;

    this.data.addMethod(
      new CodeBlock()
        .add(setterTsDoc)
        .addLine(
          `public set ${caseDataFieldName}(${caseDataFieldName}: ${interfaceTypeName}) {`,
        )
        .indent()
        .addStatement(`this._${caseDataFieldName} = ${caseDataFieldName}`)
        .unindent()
        .addLine("}"),
    );
  }

  public generateSwitchStart(): void {
    const fieldData = this.getFieldData();
    let switchValueExpression = "data." + fieldData.tsName;
    if (fieldData.type instanceof EnumType) {
      switchValueExpression = "+" + switchValueExpression;
    }
    this.data.serialize.beginControlFlow(`switch (${switchValueExpression})`);
    this.data.deserialize.beginControlFlow(`switch (${switchValueExpression})`);
  }

  public generateCase(protocolCase: XmlElement): ObjectGenerationContext {
    const fieldData = this.getFieldData();
    let caseDataTypeName = this.getCaseDataTypeName(protocolCase);
    if (getBooleanAttribute(protocolCase, "default")) {
      this.data.serialize.addLine("default:").indent();
      this.data.deserialize.addLine("default:").indent();
    } else {
      const caseValueExpression = this.getCaseValueExpression(protocolCase);
      this.data.serialize.addLine(`case ${caseValueExpression}:`).indent();
      this.data.deserialize.addLine(`case ${caseValueExpression}:`).indent();
    }

    const caseContext = this.context.copy();
    caseContext.accessibleFields.clear();
    caseContext.lengthFieldIsReferencedMap.clear();

    const caseDataFieldName = this.getCaseDataFieldName();

    if (getInstructions(protocolCase).length === 0) {
      this.data.serialize
        .beginControlFlow(`if (data._${caseDataFieldName} !== null)`)
        .addStatement(
          "throw new SerializationError(" +
            `"Expected ${caseDataFieldName} to be null ` +
            `for ${fieldData.tsName} " + data._${fieldData.tsName} + "."` +
            ")",
        )
        .endControlFlow()
        .addImport("SerializationError", "protocol/serialization-error");

      this.data.deserialize.addStatement(`data._${caseDataFieldName} = null`);
    } else {
      this.data.addAuxillaryType(
        this.generateCaseDataType(protocolCase, caseDataTypeName, caseContext),
      );

      this.data.serialize
        .beginControlFlow(
          `if (!(data._${caseDataFieldName} instanceof ${this.data.className}.${caseDataTypeName}))`,
        )
        .addStatement(
          "throw new SerializationError(" +
            `"Expected ${caseDataFieldName} to be type ${caseDataTypeName} ` +
            `for ${fieldData.tsName} " + data._${fieldData.tsName} + "."` +
            ")",
        )
        .endControlFlow()
        .addStatement(
          `${this.data.className}.${caseDataTypeName}.serialize(writer, data._${caseDataFieldName})`,
        )
        .addImport("SerializationError", "protocol/serialization-error");

      this.data.deserialize.addStatement(
        `data._${caseDataFieldName} = ${this.data.className}.${caseDataTypeName}.deserialize(reader)`,
      );
    }

    this.data.serialize.addStatement("break").unindent();
    this.data.deserialize.addStatement("break").unindent();

    return caseContext;
  }

  private generateCaseDataType(
    protocolCase: XmlElement,
    caseDataTypeName: string,
    caseContext: ObjectGenerationContext,
  ): CodeBlock {
    const objectCodeGenerator = new ObjectCodeGenerator(
      caseDataTypeName,
      this.typeFactory,
      caseContext,
    );

    objectCodeGenerator.data.superInterfaces.push(this.getInterfaceTypeName());

    getInstructions(protocolCase).forEach(
      objectCodeGenerator.generateInstruction,
      objectCodeGenerator,
    );

    const fieldData = this.getFieldData();
    let comment = getBooleanAttribute(protocolCase, "default")
      ? `Default data associated with \`${fieldData.tsName}\``
      : "Data associated with `" +
        fieldData.tsName +
        "` value `" +
        this.getCaseValueExpression(protocolCase) +
        "`";

    let protocolComment = getComment(protocolCase);
    if (protocolComment !== null) {
      comment += "\n\n";
      comment += protocolComment;
    }

    return new CodeBlock()
      .addCodeBlock(generateTsDoc(comment))
      .addCodeBlock(objectCodeGenerator.code);
  }

  public generateSwitchEnd(): void {
    this.data.serialize.endControlFlow();
    this.data.deserialize.endControlFlow();
  }

  private getFieldData(): FieldData {
    const result = this.context.accessibleFields.get(this.fieldName);
    if (!result) {
      throw new Error(`Referenced ${this.fieldName} is not accessible.`);
    }
    return result;
  }

  private getInterfaceTypeName(): string {
    return snakeCaseToPascalCase(this.fieldName) + "Data";
  }

  private getCaseDataFieldName(): string {
    return this.getFieldData().tsName + "Data";
  }

  private getCaseDataTypeName(protocolCase: XmlElement): string {
    const isDefault = getBooleanAttribute(protocolCase, "default");
    return (
      this.getInterfaceTypeName() +
      (isDefault
        ? "Default"
        : getRequiredStringAttribute(protocolCase, "value"))
    );
  }

  private getCaseValueExpression(protocolCase: XmlElement): string {
    const fieldData = this.getFieldData();

    if (fieldData.array) {
      throw new Error(
        `"${this.fieldName}" field referenced by switch must not be an array.`,
      );
    }

    const fieldType = fieldData.type;
    const caseValue = getRequiredStringAttribute(protocolCase, "value");

    if (fieldType instanceof IntegerType) {
      if (!isInteger(caseValue)) {
        throw new Error(`"${caseValue}" is not a valid integer value.`);
      }
      return caseValue;
    }

    if (fieldType instanceof EnumType) {
      const ordinalValue = tryParseInt(caseValue);
      if (ordinalValue != null) {
        const enumValue = fieldType.getEnumValueByOrdinal(ordinalValue);
        if (enumValue !== null) {
          throw new Error(
            `${fieldType.name} value ${caseValue} must be referred to by name (${enumValue.name})`,
          );
        }
        return caseValue;
      }

      const enumValue = fieldType.getEnumValueByName(caseValue);
      if (enumValue === null) {
        throw new Error(
          `"${caseValue}" is not a valid value for enum type ${fieldType.name}.`,
        );
      }
      return `${fieldType.name}.${enumValue.name}`;
    }

    throw new Error(
      `${this.fieldName} field referenced by switch must be a numeric or enumeration type.`,
    );
  }
}
