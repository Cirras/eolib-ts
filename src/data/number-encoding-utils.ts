import { CHAR_MAX, SHORT_MAX, THREE_MAX } from "./eo-numeric-limits";

/**
 * Encodes a number to a sequence of bytes.
 *
 * @param number - the number to encode
 * @returns The encoded sequence of bytes
 */
export function encodeNumber(_number: number): Uint8Array {
  let value = _number;
  let d = 0xfe;
  if (_number >= THREE_MAX) {
    d = Math.trunc(value / THREE_MAX) + 1;
    value = value % THREE_MAX;
  }

  let c = 0xfe;
  if (_number >= SHORT_MAX) {
    c = Math.trunc(value / SHORT_MAX) + 1;
    value = value % SHORT_MAX;
  }

  let b = 0xfe;
  if (_number >= CHAR_MAX) {
    b = Math.trunc(value / CHAR_MAX) + 1;
    value = value % CHAR_MAX;
  }

  let a = value + 1;

  return new Uint8Array([a, b, c, d]);
}

/**
 * Decodes a number from a sequence of bytes.
 *
 * @param bytes - the sequence of bytes to decode
 * @returns The decoded number
 */
export function decodeNumber(bytes: Uint8Array): number {
  let result = 0;
  const length = Math.min(bytes.length, 4);

  for (let i = 0; i < length; ++i) {
    let value = bytes[i];

    if (value === 0xfe) {
      break;
    }

    --value;

    switch (i) {
      case 0:
        result += value;
        break;
      case 1:
        result += CHAR_MAX * value;
        break;
      case 2:
        result += SHORT_MAX * value;
        break;
      case 3:
        result += THREE_MAX * value;
        break;
    }
  }

  return result;
}
