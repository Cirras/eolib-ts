/**
 * Interleaves a sequence of bytes. When encrypting EO data, bytes are "woven" into each other.
 * <br>
 * Used when encrypting packets and data files.
 *
 * @example
 *   {0, 1, 2, 3, 4, 5} → {0, 5, 1, 4, 2, 3}
 *
 * @remarks
 * This is an in-place operation.
 *
 * @param data - the data to interleave
 */
export function interleave(data: Uint8Array): void {
  const buffer = new Uint8Array(data.length);

  let i = 0;
  let ii = 0;

  for (; i < data.length; i += 2) {
    buffer[i] = data[ii++];
  }

  --i;

  if (data.length % 2 !== 0) {
    i -= 2;
  }

  for (; i >= 0; i -= 2) {
    buffer[i] = data[ii++];
  }

  data.set(buffer);
}

/**
 * Deinterleaves a sequence of bytes. This is the reverse of `interleave`. <br>
 * Used when decrypting packets and data files.
 *
 * @example
 *   {0, 1, 2, 3, 4, 5} → {0, 2, 4, 5, 3, 1}
 *
 * @remarks
 * This is an in-place operation.
 *
 * @param data - the data to deinterleave
 */
export function deinterleave(data: Uint8Array): void {
  const buffer = new Uint8Array(data.length);

  let i = 0;
  let ii = 0;

  for (; i < data.length; i += 2) {
    buffer[ii++] = data[i];
  }

  --i;

  if (data.length % 2 !== 0) {
    i -= 2;
  }

  for (; i >= 0; i -= 2) {
    buffer[ii++] = data[i];
  }

  data.set(buffer);
}

/**
 * Flips the most significant bits of each byte in a sequence of bytes. (Values `0` and `128` are
 * not flipped.) <br>
 * Used when encrypting and decrypting packets.
 *
 * @example
 *   {0, 1, 127, 128, 129, 254, 255} → {0, 129, 255, 128, 1, 126, 127}
 *
 * @remarks
 * This is an in-place operation.
 *
 * @param data - the data to flip most significant bits on
 */
export function flipMsb(data: Uint8Array): void {
  for (let i = 0; i < data.length; ++i) {
    if ((data[i] & 0x7f) !== 0) {
      data[i] = data[i] ^ 0x80;
    }
  }
}

/**
 * Swaps the order of contiguous bytes in a sequence of bytes that are divisible by a given
 * multiple value. <br>
 * Used when encrypting and decrypting packets and data files.
 *
 * @example
 * multiple = 3
 * {10, 21, 27} → {10, 27, 21}
 *
 * @remarks
 * This is an in-place operation.
 *
 * @param data - the data to swap bytes in
 * @param multiple - the multiple value
 */
export function swapMultiples(data: Uint8Array, multiple: number): void {
  if (multiple < 0) {
    throw new Error("multiple must be a positive number");
  }

  if (multiple === 0) {
    return;
  }

  let sequenceLength = 0;

  for (let i = 0; i <= data.length; ++i) {
    if (i !== data.length && data[i] % multiple === 0) {
      ++sequenceLength;
    } else {
      if (sequenceLength > 1) {
        for (let ii = 0; ii < sequenceLength / 2; ++ii) {
          let b = data[i - sequenceLength + ii];
          data[i - sequenceLength + ii] = data[i - ii - 1];
          data[i - ii - 1] = b;
        }
      }

      sequenceLength = 0;
    }
  }
}
