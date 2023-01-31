import { Type } from "./type";

export interface BasicType extends Type {
  typeKind: "basic";
}

export function isBasicType(object: any): object is BasicType {
  return object.typeKind === "basic";
}
