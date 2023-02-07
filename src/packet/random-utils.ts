/**
 * Returns a random integer between min and max, inclusive.
 *
 * @param min - minimum value of the range
 * @param max - maximum value of the range
 * @returns Random integer between min and max, inclusive
 *
 * @internal
 */
export function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
