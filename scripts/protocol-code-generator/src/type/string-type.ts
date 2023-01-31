import { BasicType } from "./basic-type";
import { Length } from "./length";

export class StringType implements BasicType {
  private readonly _name: string;
  private readonly _length: Length;

  public constructor(name: string, length: Length) {
    this._name = name;
    this._length = length;
  }

  public get typeKind(): "basic" {
    return "basic";
  }

  public get name(): string {
    return this._name;
  }

  public get fixedSize(): number | null {
    return this._length.asInteger();
  }

  public get bounded(): boolean {
    return this._length.specified;
  }
}
