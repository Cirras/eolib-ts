import { CustomType } from "./custom-type";

export class StructType implements CustomType {
  private _name: string;
  private _fixedSize: number | null;
  private _bounded: boolean;
  private _sourcePath: string;

  public constructor(
    name: string,
    fixedSize: number | null,
    bounded: boolean,
    sourcePath: string,
  ) {
    this._name = name;
    this._fixedSize = fixedSize;
    this._bounded = bounded;
    this._sourcePath = sourcePath;
  }

  public get typeKind(): "custom" {
    return "custom";
  }

  public get name(): string {
    return this._name;
  }

  public get fixedSize(): number | null {
    return this._fixedSize;
  }

  public get bounded(): boolean {
    return this._bounded;
  }

  public get sourcePath(): string {
    return this._sourcePath;
  }
}
