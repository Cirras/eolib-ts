/**
 * Encodes a string by inverting the bytes and then reversing them.
 *
 * <p>This is an in-place operation.
 *
 * @param bytes the byte array to encode
 */
export function encodeString(bytes: Uint8Array): void {
  invertCharacters(bytes);
  bytes.reverse();
}

/**
 * Decodes a string by reversing the bytes and then inverting them.
 *
 * <p>This is an in-place operation.
 *
 * @param bytes the byte array to decode
 */
export function decodeString(bytes: Uint8Array): void {
  bytes.reverse();
  invertCharacters(bytes);
}

function invertCharacters(bytes: Uint8Array): void {
  let flippy: boolean = bytes.length % 2 == 1;

  for (let i = 0; i < bytes.length; ++i) {
    const c = bytes[i];
    let f = 0;

    if (flippy) {
      f = 0x2e;
      if (c >= 0x50) {
        f *= -1;
      }
    }

    if (c >= 0x22 && c <= 0x7e) {
      bytes[i] = 0x9f - c - f;
    }

    flippy = !flippy;
  }
}
