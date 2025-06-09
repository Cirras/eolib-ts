import { tryParseInt } from "../util/number-utils";

export class Length {
  private readonly _string: string;
  private readonly _integer: number;

  private constructor(lengthString: string | null) {
    this._string = lengthString;
    this._integer = tryParseInt(lengthString);
  }

  public static fromString(lengthString: string) {
    return new Length(lengthString);
  }

  public static unspecified() {
    return new Length(null);
  }

  public asInteger(): number | null {
    return this._integer;
  }

  public get specified(): boolean {
    return this._string !== null;
  }
}
