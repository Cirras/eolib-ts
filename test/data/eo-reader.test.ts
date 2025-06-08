import { EoReader } from "@eolib/data/eo-reader.js";
import { encode1252 } from "@eolib/data/windows-1252.js";

describe("EoReader", () => {
  describe("#slice()", () => {
    it("should return a reader at the specified offset and length", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03, 0x04, 0x05, 0x06);
      reader.getByte();
      reader.chunkedReadingMode = true;

      const reader2 = reader.slice();
      expect(reader2.position).toBe(0);
      expect(reader2.remaining).toBe(5);
      expect(reader2.chunkedReadingMode).toBe(false);

      const reader3 = reader2.slice(1);
      expect(reader3.position).toBe(0);
      expect(reader3.remaining).toBe(4);
      expect(reader3.chunkedReadingMode).toBe(false);

      const reader4 = reader3.slice(1, 2);
      expect(reader4.position).toBe(0);
      expect(reader4.remaining).toBe(2);
      expect(reader4.chunkedReadingMode).toBe(false);

      expect(reader.position).toBe(1);
      expect(reader.remaining).toBe(5);
      expect(reader.chunkedReadingMode).toBe(true);
    });

    it("should allow over-read", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03);
      expect(reader.slice(2, 5).remaining).toBe(1);
      expect(reader.slice(3).remaining).toBe(0);
      expect(reader.slice(4).remaining).toBe(0);
      expect(reader.slice(4, 12345).remaining).toBe(0);
    });

    it("should thow an error when a negative index is provided", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03);
      expect(() => reader.slice(-1)).toThrow();
    });

    it("should thow an error when a negative length is provided", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03);
      expect(() => reader.slice(0, -1)).toThrow();
    });
  });

  describe("#getByte()", () => {
    it("should return raw 1-byte values", () => {
      const bytes = [0x00, 0x01, 0x02, 0x80, 0xfd, 0xfe, 0xff];
      const reader = readerFromBytes(...bytes);
      for (const byte of bytes) {
        expect(reader.getByte()).toEqual(byte);
      }
    });

    it("should over-read 0 values", () => {
      const reader = readerFromBytes();
      expect(reader.getByte()).toBe(0);
    });
  });

  describe("#getBytes()", () => {
    it("should return raw byte values", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03);
      expect(reader.getBytes(3)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
    });

    it("should return a partial array when length < remaining", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03);
      expect(reader.getBytes(1)).toEqual(new Uint8Array([0x01]));
    });

    it("should return a truncated array when length > remaining", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x03);
      expect(reader.getBytes(5)).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
      expect(reader.getBytes(0)).toHaveLength(0);
    });
  });

  describe("#getChar()", () => {
    it("should return decoded 1-byte values", () => {
      const reader = readerFromBytes(0x01, 0x02, 0x80, 0x81, 0xfd, 0xfe, 0xff);
      expect(reader.getChar()).toBe(0);
      expect(reader.getChar()).toBe(1);
      expect(reader.getChar()).toBe(127);
      expect(reader.getChar()).toBe(128);
      expect(reader.getChar()).toBe(252);
      expect(reader.getChar()).toBe(0);
      expect(reader.getChar()).toBe(254);
    });
  });

  describe("#getShort()", () => {
    it("should return decoded 2-byte values", () => {
      // prettier-ignore
      const reader = readerFromBytes(
        0x01, 0xfe, 0x02, 0xfe, 0x80, 0xfe, 0xfd, 0xfe, 0xfe, 0xfe, 0xfe, 0x80, 0x7f, 0x7f, 0xfd,
        0xfd
      );
      expect(reader.getShort()).toBe(0);
      expect(reader.getShort()).toBe(1);
      expect(reader.getShort()).toBe(127);
      expect(reader.getShort()).toBe(252);
      expect(reader.getShort()).toBe(0);
      expect(reader.getShort()).toBe(0);
      expect(reader.getShort()).toBe(32004);
      expect(reader.getShort()).toBe(64008);
    });
  });

  describe("#getThree()", () => {
    it("should return decoded 3-byte values", () => {
      // prettier-ignore
      const reader = readerFromBytes(
        0x01, 0xfe, 0xfe, 0x02, 0xfe, 0xfe, 0x80, 0xfe, 0xfe, 0xfd, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe,
        0xfe, 0x80, 0x81, 0x7f, 0x7f, 0xfe, 0xfd, 0xfd, 0xfe, 0xfd, 0xfd, 0xfd
      );
      expect(reader.getThree()).toBe(0);
      expect(reader.getThree()).toBe(1);
      expect(reader.getThree()).toBe(127);
      expect(reader.getThree()).toBe(252);
      expect(reader.getThree()).toBe(0);
      expect(reader.getThree()).toBe(0);
      expect(reader.getThree()).toBe(32004);
      expect(reader.getThree()).toBe(64008);
      expect(reader.getThree()).toBe(16194276);
    });
  });

  describe("#getInt()", () => {
    it("should return decoded 4-byte values", () => {
      // prettier-ignore
      const reader = readerFromBytes(
        0x01, 0xfe, 0xfe, 0xfe, 0x02, 0xfe, 0xfe, 0xfe, 0x80, 0xfe, 0xfe, 0xfe, 0xfd, 0xfe, 0xfe,
        0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0xfe, 0x80, 0x81, 0x82, 0x7f, 0x7f, 0xfe, 0xfe, 0xfd, 0xfd,
        0xfe, 0xfe, 0xfd, 0xfd, 0xfd, 0xfe, 0x7f, 0x7f, 0x7f, 0x7f, 0xfd, 0xfd, 0xfd, 0xfd
      );
      expect(reader.getInt()).toBe(0);
      expect(reader.getInt()).toBe(1);
      expect(reader.getInt()).toBe(127);
      expect(reader.getInt()).toBe(252);
      expect(reader.getInt()).toBe(0);
      expect(reader.getInt()).toBe(0);
      expect(reader.getInt()).toBe(32004);
      expect(reader.getInt()).toBe(64008);
      expect(reader.getInt()).toBe(16194276);
      expect(reader.getInt()).toBe(2_048_576_040);
      expect(reader.getInt()).toBe(4_097_152_080);
    });
  });

  describe("#getString()", () => {
    it("should return all data as a raw string", () => {
      const reader = readerFromString("Hello, World!");
      expect(reader.getString()).toBe("Hello, World!");
    });

    it("should return each chunk as a raw string", () => {
      const reader = readerFromString("Hello,ÿWorld!");
      reader.chunkedReadingMode = true;

      expect(reader.getString()).toBe("Hello,");

      reader.nextChunk();
      expect(reader.getString()).toBe("World!");
    });
  });

  describe("#getFixedString()", () => {
    it("should return fixed-size portions of raw string data", () => {
      const reader = readerFromString("foobar");
      expect(reader.getFixedString(3)).toBe("foo");
      expect(reader.getFixedString(3)).toBe("bar");
    });

    it("should return fixed-size portions of raw string data with padding removed", () => {
      const reader = readerFromString("fooÿbarÿÿÿ");
      expect(reader.getFixedString(4, true)).toBe("foo");
      expect(reader.getFixedString(6, true)).toBe("bar");
    });

    it("should thow an error when a negative length is provided", () => {
      const reader = readerFromString("foo");
      expect(() => reader.getFixedString(-1)).toThrow();
    });
  });

  describe("#getEncodedString()", () => {
    it("should return all data as a decoded string", () => {
      const reader = readerFromString("!;a-^H s^3a:)");
      expect(reader.getEncodedString()).toBe("Hello, World!");
    });

    it("should return each chunk as a decoded string", () => {
      const reader = readerFromString("E0a3hWÿ!;a-^H");
      reader.chunkedReadingMode = true;

      expect(reader.getEncodedString()).toBe("Hello,");

      reader.nextChunk();
      expect(reader.getEncodedString()).toBe("World!");
    });
  });

  describe("#getFixedEncodedString()", () => {
    it("should return fixed-size portions of decoded string data", () => {
      const reader = readerFromString("^0g[>k");
      expect(reader.getFixedEncodedString(3)).toBe("foo");
      expect(reader.getFixedEncodedString(3)).toBe("bar");
    });

    it("should return fixed-size portions of decoded string data with padding removed", () => {
      const reader = readerFromString("ÿ0^9ÿÿÿ-l=S>k");
      expect(reader.getFixedEncodedString(4, true)).toBe("foo");
      expect(reader.getFixedEncodedString(6, true)).toBe("bar");
      expect(reader.getFixedEncodedString(3, true)).toBe("baz");
    });

    it("should thow an error when a negative length is provided", () => {
      const reader = readerFromString("foo");
      expect(() => reader.getFixedEncodedString(-1)).toThrow();
    });
  });

  describe("#nextChunk()", () => {
    it("should move the reader position to the start of the next chunk", () => {
      // prettier-ignore
      const reader = readerFromBytes(0x01, 0x02, 0xff, 0x03, 0x04, 0x5, 0xff, 0x06);
      reader.chunkedReadingMode = true;

      expect(reader.position).toBe(0);

      reader.nextChunk();
      expect(reader.position).toBe(3);

      reader.nextChunk();
      expect(reader.position).toBe(7);

      reader.nextChunk();
      expect(reader.position).toBe(8);

      reader.nextChunk();
      expect(reader.position).toBe(8);
    });

    it("should work correctly when chunked reading mode is toggled between calls", () => {
      // prettier-ignore
      const reader = readerFromBytes(0x01, 0x02, 0xff, 0x03, 0x04, 0x5, 0xff, 0x06);
      expect(reader.position).toBe(0);

      reader.chunkedReadingMode = true;
      reader.nextChunk();
      reader.chunkedReadingMode = false;
      expect(reader.position).toBe(3);

      reader.chunkedReadingMode = true;
      reader.nextChunk();
      reader.chunkedReadingMode = false;
      expect(reader.position).toBe(7);

      reader.chunkedReadingMode = true;
      reader.nextChunk();
      reader.chunkedReadingMode = false;
      expect(reader.position).toBe(8);

      reader.chunkedReadingMode = true;
      reader.nextChunk();
      reader.chunkedReadingMode = false;
      expect(reader.position).toBe(8);
    });

    it("should throw an error when the reader is not in chunked reading mode", () => {
      // prettier-ignore
      const reader = readerFromBytes(0x01, 0x02, 0xff, 0x03, 0x04, 0x5, 0xff, 0x06);
      expect(() => reader.nextChunk()).toThrow();
    });
  });

  describe("#remaining", () => {
    it("should reflect how much data is left", () => {
      // prettier-ignore
      const reader = readerFromBytes(
        0x01, 0x03, 0x04, 0xfe, 0x05, 0xfe, 0xfe, 0x06, 0xfe, 0xfe, 0xfe
      );

      expect(reader.remaining).toBe(11);
      reader.getByte();
      expect(reader.remaining).toBe(10);
      reader.getChar();
      expect(reader.remaining).toBe(9);
      reader.getShort();
      expect(reader.remaining).toBe(7);
      reader.getThree();
      expect(reader.remaining).toBe(4);
      reader.getInt();
      expect(reader.remaining).toBe(0);

      reader.getChar();
      expect(reader.remaining).toBe(0);
    });

    it("should reflect how much data is left in the current chunk", () => {
      // prettier-ignore
      const reader = readerFromBytes(
        0x01, 0x03, 0x04, 0xff, 0x05, 0xfe, 0xfe, 0x06, 0xfe, 0xfe, 0xfe
      );

      reader.chunkedReadingMode = true;

      expect(reader.remaining).toBe(3);
      reader.getChar();
      reader.getShort();
      expect(reader.remaining).toBe(0);

      reader.getChar();
      expect(reader.remaining).toBe(0);

      reader.nextChunk();
      expect(reader.remaining).toBe(7);
    });
  });

  // See: https://github.com/Cirras/eo-protocol/blob/master/docs/chunks.md#1-under-read
  it("should handle under-read", () => {
    // prettier-ignore
    const reader = readerFromBytes(
      0x7c, 0x67, 0x61, 0x72, 0x62, 0x61, 0x67, 0x65, 0xff, 0xca, 0x31
    );
    reader.chunkedReadingMode = true;

    expect(reader.getChar()).toBe(123);
    reader.nextChunk();
    expect(reader.getShort()).toBe(12345);
  });

  // See: https://github.com/Cirras/eo-protocol/blob/master/docs/chunks.md#2-over-read
  it("should handle over-read", () => {
    // See: https://github.com/Cirras/eo-protocol/blob/master/docs/chunks.md#2-over-read
    const reader = readerFromBytes(0xff, 0x7c);
    reader.chunkedReadingMode = true;

    expect(reader.getInt()).toBe(0);
    reader.nextChunk();
    expect(reader.getShort()).toBe(123);
  });

  // See: https://github.com/Cirras/eo-protocol/blob/master/docs/chunks.md#3-double-read
  it("should handle double-read", () => {
    const reader = readerFromBytes(0xff, 0x7c, 0xca, 0x31);

    // Reading all 4 bytes of the input data
    expect(reader.getInt()).toBe(790222478);

    // Activating chunked mode and seeking to the first break byte with nextChunk(), which actually
    // takes our reader position backwards.
    reader.chunkedReadingMode = true;
    reader.nextChunk();

    expect(reader.getChar()).toBe(123);
    expect(reader.getShort()).toBe(12345);
  });
});

function readerFromString(str: string): EoReader {
  return new EoReader(encode1252(str));
}

function readerFromBytes(...bytes: number[]): EoReader {
  return new EoReader(new Uint8Array(bytes));
}
