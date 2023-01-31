import { IntegerType } from "./integer-type";
import { Type } from "./type";

export interface HasUnderlyingType extends Type {
  get underlyingType(): IntegerType;
}

export function hasUnderlyingType(object: any): object is HasUnderlyingType {
  return "underlyingType" in object;
}
