import { Type } from "./type";

export class BlobType implements Type {
  public get typeKind(): "special" {
    return "special";
  }

  public get name(): string {
    return "blob";
  }

  public get fixedSize(): number | null {
    return null;
  }

  public get bounded(): boolean {
    return false;
  }
}
