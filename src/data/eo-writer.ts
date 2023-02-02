import { encodeNumber } from "./number-encoding-utils";
import { encodeString } from "./string-encoding-utils";
import { CHAR_MAX, SHORT_MAX, THREE_MAX, INT_MAX } from "./eo-numeric-limits";

import * as windows1252 from "windows-1252";

/** A class for writing EO data to a sequence of bytes. */
export class EoWriter {
  private data: Uint8Array = new Uint8Array(16);
  private _length: number = 0;

  /**
   * Adds a raw byte to the writer data.
   *
   * @param value - the byte to add
   * @throws `Error` if the value is above `0xFF`.
   */
  public addByte(value: number): void {
    EoWriter.checkNumberSize(value, 0xff);
    if (this._length + 1 > this.data.length) {
      this.expand(2);
    }
    this.data[this._length++] = value;
  }

  /**
   * Adds an array of raw bytes to the writer data.
   *
   * @param bytes - the array of bytes to add
   */
  public addBytes(bytes: Uint8Array): void {
    this.doAddBytes(bytes, bytes.length);
  }

  /**
   * Adds an encoded 1-byte integer to the writer data.
   *
   * @param char - the number to encode and add
   * @throws `Error` if the value is not below {@link CHAR_MAX}.
   */
  public addChar(char: number) {
    EoWriter.checkNumberSize(char, CHAR_MAX - 1);
    const bytes: Uint8Array = encodeNumber(char);
    this.doAddBytes(bytes, 1);
  }

  /**
   * Adds an encoded 2-byte integer to the writer data.
   *
   * @param number - the number to encode and add
   * @throws `Error` if the value is not below {@link SHORT_MAX}.
   */
  public addShort(short: number): void {
    EoWriter.checkNumberSize(short, SHORT_MAX - 1);
    const bytes: Uint8Array = encodeNumber(short);
    this.doAddBytes(bytes, 2);
  }

  /**
   * Adds an encoded 3-byte integer to the writer data.
   *
   * @param number - the number to encode and add
   * @throws `Error` if the value is not below {@link THREE_MAX}.
   */
  public addThree(three: number): void {
    EoWriter.checkNumberSize(three, THREE_MAX - 1);
    const bytes: Uint8Array = encodeNumber(three);
    this.doAddBytes(bytes, 3);
  }

  /**
   * Adds an encoded 4-byte integer to the writer data.
   *
   * @param number - the number to encode and add
   * @throws `Error` if the value is not below {@link INT_MAX}.
   */
  public addInt(int: number): void {
    EoWriter.checkNumberSize(int, INT_MAX - 1);
    const bytes: Uint8Array = encodeNumber(int);
    this.doAddBytes(bytes, 4);
  }

  /**
   * Adds a string to the writer data.
   *
   * @param string - the string to be added
   */
  public addString(str: string): void {
    const bytes: Uint8Array = EoWriter.encodeAnsi(str);
    this.doAddBytes(bytes);
  }

  /**
   * Adds a fixed-length string to the writer data.
   *
   * @param string - the string to be added
   * @param length - the expected length of the string
   * @param padded - true if the string should be padded to the length with trailing `0xFF`
   *     bytes.
   * @throws `Error` if the string does not have the expected length
   */
  public addFixedString(
    str: string,
    length: number,
    padded: boolean = false
  ): void {
    EoWriter.checkStringLength(str, length, padded);
    let bytes: Uint8Array = EoWriter.encodeAnsi(str);
    if (padded) {
      bytes = EoWriter.addPadding(bytes, length);
    }
    this.doAddBytes(bytes);
  }

  /**
   * Adds an encoded string to the writer data.
   *
   * @param - string the string to encoded and added
   */
  public addEncodedString(str: string): void {
    const bytes: Uint8Array = EoWriter.encodeAnsi(str);
    encodeString(bytes);
    this.doAddBytes(bytes);
  }

  /**
   * Adds a fixed-length encoded string to the writer data.
   *
   * @param string - the string to be encoded and added
   * @param length - the expected length of the string
   * @param padded - true if the string should be padded to the length with trailing `0xFF`
   *     bytes
   * @throws `Error` if the string does not have the expected length
   */
  public addFixedEncodedString(
    str: string,
    length: number,
    padded: boolean = false
  ): void {
    EoWriter.checkStringLength(str, length, padded);
    let bytes: Uint8Array = EoWriter.encodeAnsi(str);
    if (padded) {
      bytes = EoWriter.addPadding(bytes, length);
    }
    encodeString(bytes);
    this.doAddBytes(bytes);
  }

  /**
   * Gets the length of the writer data.
   *
   * @returns The length of the writer data
   */
  public get length(): number {
    return this._length;
  }

  /**
   * Gets the writer data as a byte array.
   *
   * @returns A copy of the writer data as a byte array
   */
  public toByteArray(): Uint8Array {
    return this.data.slice(0, this._length);
  }

  private doAddBytes(
    bytes: Uint8Array,
    bytesLength: number = bytes.length
  ): void {
    let expandFactor = 1;
    while (this._length + bytesLength > this.data.length * expandFactor) {
      expandFactor *= 2;
    }

    if (expandFactor > 1) {
      this.expand(expandFactor);
    }

    this.data.set(bytes.subarray(0, bytesLength), this._length);
    this._length += bytesLength;
  }

  private expand(expandFactor: number): void {
    const expanded = new Uint8Array(this.data.length * expandFactor);
    expanded.set(this.data);
    this.data = expanded;
  }

  private static addPadding(bytes: Uint8Array, length: number): Uint8Array {
    if (bytes.length == length) {
      return bytes;
    }

    const result = new Uint8Array(length).fill(0xff);
    result.set(bytes);

    return result;
  }

  private static checkNumberSize(value: number, max: number): void {
    if (value > max) {
      throw new Error(`Value ${value} exceeds maximum of ${max}.`);
    }
  }

  private static checkStringLength(
    str: string,
    length: number,
    padded: boolean
  ): void {
    if (padded) {
      if (length >= str.length) {
        return;
      }
      throw new Error(
        `Padded string "${str}" is too large for a length of ${length}.`
      );
    }

    if (str.length != length) {
      throw new Error(
        `String "${str}" does not have expected length of ${length}.`
      );
    }
  }

  private static encodeAnsi(str: string): Uint8Array {
    const encodedUint16 = windows1252.encode(str);
    const result = new Uint8Array(encodedUint16.length);
    for (let i = 0; i < encodedUint16.length; ++i) {
      result[i] = encodedUint16[i];
    }
    return result;
  }
}
