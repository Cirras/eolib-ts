import { BasicType } from "./basic-type";

export class IntegerType implements BasicType {
  private readonly _name: string;
  private readonly _size: number;

  public constructor(name: string, size: number) {
    this._name = name;
    this._size = size;
  }

  public get typeKind(): "basic" {
    return "basic";
  }

  public get name(): string {
    return this._name;
  }

  public get fixedSize(): number | null {
    return this._size;
  }

  public get bounded(): boolean {
    return true;
  }
}
