import { capitalize, isLowerCase, isUpperCase } from "./string-utils";

export function pascalCaseToKebabCase(name: string): string {
  let result = "";
  for (let i = 0; i < name.length; ++i) {
    let c = name.charAt(i);
    if (
      i > 0 &&
      isUpperCase(c) &&
      ((i + 1 < name.length && !isUpperCase(name.charAt(i + 1))) ||
        isLowerCase(name.charAt(i - 1)))
    ) {
      result += "-";
    }
    result += c.toLowerCase();
  }
  return result;
}

export function snakeCaseToCamelCase(name: string): string {
  let result = "";
  let uppercaseNext = false;
  for (let i = 0; i < name.length; ++i) {
    let c = name.charAt(i);
    if (c === "_") {
      uppercaseNext = result.length > 0;
      continue;
    }
    if (uppercaseNext) {
      c = c.toUpperCase();
      uppercaseNext = false;
    } else {
      c = c.toLowerCase();
    }
    result += c;
  }
  return result;
}

export function snakeCaseToPascalCase(name: string): string {
  return capitalize(snakeCaseToCamelCase(name));
}
