import { XmlElement, XmlNode, XmlText } from "@rgrove/parse-xml";
import { tryParseInt } from "./number-utils";

export function getInstructions(element: XmlElement): Array<XmlElement> {
  return element.children.filter((child) => {
    if (!(child instanceof XmlElement)) {
      return false;
    }
    switch (child.name) {
      case "field":
      case "array":
      case "length":
      case "dummy":
      case "switch":
      case "chunked":
      case "break":
        return true;
      default:
        return false;
    }
  }) as Array<XmlElement>;
}

export function getComment(element: XmlElement): string | null {
  const commentElement: XmlElement = element.children.find(
    (child) => child instanceof XmlElement && child.name === "comment",
  ) as XmlElement;

  if (commentElement) {
    return getText(commentElement);
  }

  return null;
}

export function getText(element: XmlElement): string | null {
  let result = "";

  for (const child of element.children) {
    if (child.type === XmlNode.TYPE_TEXT) {
      const text = (child as XmlText).text.trim();
      if (text.length === 0) {
        continue;
      }

      if (result !== "") {
        throw new Error(`Unexpected text content "${text}"`);
      }

      result = text;
    }
  }

  return result || null;
}

export function getStringAttribute(
  element: XmlElement,
  name: string,
  defaultValue: string = null,
): string {
  const attributeText: string | undefined = element.attributes[name];
  if (attributeText === undefined) {
    return defaultValue;
  }
  return attributeText;
}

export function getIntAttribute(
  element: XmlElement,
  name: string,
  defaultValue: number = 0,
): number {
  const attributeText: string | undefined = element.attributes[name];
  if (attributeText === undefined) {
    return defaultValue;
  }
  const result: number | null = tryParseInt(attributeText);
  if (result === null) {
    throw new Error(
      `${name} attribute has invalid integer value: ${attributeText.trim()}`,
    );
  }
  return result;
}

export function getBooleanAttribute(
  element: XmlElement,
  name: string,
  defaultValue: boolean = false,
): boolean {
  const attributeText: string | undefined = element.attributes[name];
  if (attributeText === undefined) {
    return defaultValue;
  }
  return attributeText.toLowerCase() === "true";
}

export function getRequiredStringAttribute(
  element: XmlElement,
  name: string,
): string {
  requireAttribute(element, name);
  return getStringAttribute(element, name);
}

export function getRequiredIntAttribute(
  element: XmlElement,
  name: string,
): number {
  requireAttribute(element, name);
  return getIntAttribute(element, name);
}

export function getRequiredBooleanAttribute(
  element: XmlElement,
  name: string,
): boolean {
  requireAttribute(element, name);
  return getBooleanAttribute(element, name);
}

function requireAttribute(element: XmlElement, name: string): void {
  if (element.attributes[name] === undefined) {
    throw new Error(`Required attribute "${name}" is missing.`);
  }
}
