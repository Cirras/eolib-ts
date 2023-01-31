export function isUpperCase(str: string): boolean {
  return str === str.toUpperCase();
}

export function isLowerCase(str: string): boolean {
  return str === str.toLowerCase();
}

export function capitalize(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}
