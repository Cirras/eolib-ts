import { BasicType } from "./basic-type";
import { IntegerType } from "./integer-type";
import { HasUnderlyingType } from "./has-underlying-type";

export class BoolType implements BasicType, HasUnderlyingType {
  private readonly _underlyingType: IntegerType;

  public constructor(underlyingType: IntegerType) {
    this._underlyingType = underlyingType;
  }

  public get typeKind(): "basic" {
    return "basic";
  }

  public get name(): string {
    return "bool";
  }

  public get fixedSize(): number | null {
    return this._underlyingType.fixedSize;
  }

  public get bounded(): boolean {
    return true;
  }

  public get underlyingType(): IntegerType {
    return this._underlyingType;
  }
}
