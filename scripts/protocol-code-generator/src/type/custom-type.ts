import { Type } from "./type";

export interface CustomType extends Type {
  typeKind: "custom";
  get sourcePath(): string;
}

export function isCustomType(object: any): object is CustomType {
  return object.typeKind === "custom";
}
