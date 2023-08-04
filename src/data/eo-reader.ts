import { decodeNumber } from "./number-encoding-utils";
import { decodeString } from "./string-encoding-utils";

import * as windows1252 from "windows-1252";

/**
 * A class for reading EO data from a sequence of bytes.
 *
 * <p>`EoReader` features a chunked reading mode, which is important for accurate emulation of
 * the official game client.
 *
 * @see {@link https://github.com/Cirras/eo-protocol/blob/master/docs/chunks.md | Chunked Reading}
 */
export class EoReader {
  private readonly data: Uint8Array;
  private _position: number = 0;
  private _chunkedReadingMode: boolean = false;
  private chunkStart: number = 0;
  private nextBreak: number = -1;

  /**
   * Creates a new `EoReader` instance for the specified data.
   *
   * @param data - the byte array containing the input data
   */
  public constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * Creates a new `EoReader` whose input data is a shared subsequence of this reader's data.
   *
   * <p>The input data of the new reader will start at position `index` in this reader and contain
   * all remaining data. The two reader's position and chunked reading mode will be independent.
   *
   * <p>The new reader's position will be zero, and its chunked reading mode will be false.
   *
   * @param [index] - the position in this reader at which the data of the new reader will start;
   *     must be non-negative. Defaults to the current reader position.
   * @param [length] - the length of the shared subsequence of data to supply to the new reader;
   *     must be non-negative. Defaults to the length of the remaining data starting from `index`.
   * @throws `Error` if `index` or `length` is negative. <br>
   *     This exception will **not** be thrown if `index + length` is greater than the size of the
   *     input data. Consistent with the existing over-read behaviors, the new reader will be
   *     supplied a shared subsequence of all remaining data starting from `index`.
   * @returns The new reader
   */
  public slice(
    index: number = this.position,
    length: number = Math.max(0, this.data.length - index),
  ): EoReader {
    if (index < 0) {
      throw new Error("negative index: " + index);
    }

    if (length < 0) {
      throw new Error("negative length: " + length);
    }

    let begin = Math.max(0, Math.min(this.data.length, index));
    let end = begin + Math.min(this.data.length - begin, length);

    if (begin === end) {
      return new EoReader(new Uint8Array([]));
    } else {
      return new EoReader(this.data.subarray(begin, end));
    }
  }

  /**
   * Reads a raw byte from the input data.
   *
   * @returns A raw byte
   */
  public getByte(): number {
    return this.readByte();
  }

  /**
   * Reads an array of raw bytes from the input data.
   *
   * @returns An array of raw bytes
   */
  public getBytes(length: number): Uint8Array {
    return this.readBytes(length);
  }

  /**
   * Reads an encoded 1-byte integer from the input data.
   *
   * @returns A decoded 1-byte integer
   */
  public getChar(): number {
    return decodeNumber(this.readBytes(1));
  }

  /**
   * Reads an encoded 2-byte integer from the input data.
   *
   * @returns A decoded 2-byte integer
   */
  public getShort(): number {
    return decodeNumber(this.readBytes(2));
  }

  /**
   * Reads an encoded 3-byte integer from the input data.
   *
   * @returns A decoded 3-byte integer
   */
  public getThree(): number {
    return decodeNumber(this.readBytes(3));
  }

  /**
   * Reads an encoded 4-byte integer from the input data.
   *
   * @returns A decoded 4-byte integer
   */
  public getInt(): number {
    return decodeNumber(this.readBytes(4));
  }

  /**
   * Reads a string from the input data.
   *
   * @returns A string
   */
  public getString(): string {
    const bytes = this.readBytes(this.remaining);
    return EoReader.decodeAnsi(bytes);
  }

  /**
   * Reads a string with a fixed length from the input data.
   *
   * @param length - the length of the string
   * @param padded - true if the string is padded with trailing `0xFF` bytes
   * @returns A decoded string
   * @throws `Error` if the length is negative
   */
  public getFixedString(length: number, padded: boolean = false): string {
    if (length < 0) {
      throw new Error("Negative length");
    }
    let bytes = this.readBytes(length);
    if (padded) {
      bytes = EoReader.removePadding(bytes);
    }
    return EoReader.decodeAnsi(bytes);
  }

  /**
   * Reads an encoded string from the input data.
   *
   * @returns A decoded string
   */
  public getEncodedString(): string {
    const bytes = this.readBytes(this.remaining);
    decodeString(bytes);
    return EoReader.decodeAnsi(bytes);
  }

  /**
   * Reads an encoded string with a fixed length from the input data.
   *
   * @param length - the length of the string
   * @param padded - true if the string is padded with trailing `0xFF` bytes
   * @returns A decoded string
   * @throws `Error` if the length is negative
   */
  public getFixedEncodedString(
    length: number,
    padded: boolean = false,
  ): string {
    if (length < 0) {
      throw new Error("Negative length");
    }
    let bytes = this.readBytes(length);
    decodeString(bytes);
    if (padded) {
      bytes = EoReader.removePadding(bytes);
    }
    return EoReader.decodeAnsi(bytes);
  }

  /**
   * Sets the chunked reading mode for the reader.
   *
   * <p>In chunked reading mode:
   *
   * <ul>
   *   <li>the reader will treat `0xFF` bytes as the end of the current chunk.
   *   <li>{@link nextChunk} can be called to move to the next chunk.
   * </ul>
   *
   * @param chunkedReadingMode - the new chunked reading mode
   */
  public set chunkedReadingMode(chunkedReadingMode: boolean) {
    this._chunkedReadingMode = chunkedReadingMode;
    if (this.nextBreak == -1) {
      this.nextBreak = this.findNextBreakIndex();
    }
  }

  /**
   * Gets the chunked reading mode for the reader.
   *
   * @returns True if the reader is in chunked reading mode
   */
  public get chunkedReadingMode(): boolean {
    return this._chunkedReadingMode;
  }

  /**
   * If chunked reading mode is enabled, gets the number of bytes remaining in the current chunk.
   * Otherwise, gets the total number of bytes remaining in the input data.
   *
   * @returns The number of bytes remaining
   */
  public get remaining(): number {
    if (this.chunkedReadingMode) {
      return this.nextBreak - Math.min(this.position, this.nextBreak);
    } else {
      return this.data.length - this.position;
    }
  }

  /**
   * Moves the reader position to the start of the next chunk in the input data.
   *
   * @throws `Error` if not in chunked reading mode
   */
  public nextChunk(): void {
    if (!this.chunkedReadingMode) {
      throw new Error("Not in chunked reading mode.");
    }

    this._position = this.nextBreak;
    if (this._position < this.data.length) {
      // Skip the break byte
      ++this._position;
    }

    this.chunkStart = this._position;
    this.nextBreak = this.findNextBreakIndex();
  }

  /**
   * Gets the current position in the input data.
   *
   * @returns The current position in the input data
   */
  public get position(): number {
    return this._position;
  }

  private readByte(): number {
    if (this.remaining > 0) {
      return this.data[this._position++];
    }
    return 0;
  }

  private readBytes(length: number): Uint8Array {
    length = Math.min(length, this.remaining);

    const result = this.data.slice(this.position, this.position + length);
    this._position += length;

    return result;
  }

  private findNextBreakIndex(): number {
    let result = this.data.indexOf(0xff, this.chunkStart);
    if (result === -1) {
      result = this.data.length;
    }
    return result;
  }

  private static removePadding(bytes: Uint8Array): Uint8Array {
    const paddingStart = bytes.indexOf(0xff);
    if (paddingStart !== -1) {
      return bytes.slice(0, paddingStart);
    }
    return bytes;
  }

  private static decodeAnsi(bytes: Uint8Array): string {
    return windows1252.decode(bytes);
  }
}
