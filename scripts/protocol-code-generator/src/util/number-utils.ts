export function tryParseInt(input: string): number | null {
  const parsed = Number.parseInt(input);
  return isNaN(parsed) ? null : parsed;
}

export function isInteger(input: string): boolean {
  return tryParseInt(input) !== null;
}
