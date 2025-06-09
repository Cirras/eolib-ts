import { CustomType } from "./custom-type";
import { IntegerType } from "./integer-type";

export class EnumType implements CustomType {
  private readonly _name: string;
  private readonly _sourcePath: string;
  private readonly _underlyingType: IntegerType;
  private readonly _values: EnumValue[];

  public constructor(
    name: string,
    sourcePath: string,
    underlyingType: IntegerType,
    values: EnumValue[],
  ) {
    this._name = name;
    this._sourcePath = sourcePath;
    this._underlyingType = underlyingType;
    this._values = values;
  }

  public get typeKind(): "custom" {
    return "custom";
  }

  public get name(): string {
    return this._name;
  }

  public get sourcePath(): string {
    return this._sourcePath;
  }

  public get fixedSize(): number {
    return this.underlyingType.fixedSize;
  }

  public get bounded(): boolean {
    return this.underlyingType.bounded;
  }

  public get underlyingType(): IntegerType {
    return this._underlyingType;
  }

  public get values(): EnumValue[] {
    return this._values;
  }

  public getEnumValueByOrdinal(ordinalValue: number): EnumValue {
    return (
      this._values.find((value) => value.ordinalValue === ordinalValue) ?? null
    );
  }

  public getEnumValueByName(name: string): EnumValue {
    return this._values.find((value) => value.name === name) ?? null;
  }
}

export class EnumValue {
  private readonly _ordinalValue: number;
  private readonly _name: string;

  public constructor(ordinalValue: number, name: string) {
    this._ordinalValue = ordinalValue;
    this._name = name;
  }

  public get ordinalValue(): number {
    return this._ordinalValue;
  }

  public get name(): string {
    return this._name;
  }
}
