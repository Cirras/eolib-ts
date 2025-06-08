import {
  CHAR_MAX,
  INT_MAX,
  SHORT_MAX,
  THREE_MAX,
} from "@eolib/data/eo-numeric-limits.js";
import { EoWriter } from "@eolib/data/eo-writer.js";

import { describe, it, expect } from "vitest";

describe("EoWriter", () => {
  describe("#addByte()", () => {
    it("should add a raw 1-byte value", () => {
      const writer = new EoWriter();
      writer.addByte(0);
      expect(writer.toByteArray()).toEqual(u8(0x00));
    });

    it("should allow a value of 255", () => {
      const writer = new EoWriter();
      expect(() => writer.addByte(0xff)).not.toThrow();
    });

    it("should not allow a value of 256", () => {
      const writer = new EoWriter();
      expect(() => writer.addByte(256)).toThrow();
    });
  });

  describe("#addBytes()", () => {
    it("should add a sequence of raw 1-byte values", () => {
      const writer = new EoWriter();
      writer.addBytes(u8(0x00, 0xff));
      expect(writer.toByteArray()).toEqual(u8(0x00, 0xff));
    });
  });

  describe("#addChar()", () => {
    it("should add an encoded 1-byte value", () => {
      const writer = new EoWriter();
      writer.addChar(123);
      expect(writer.toByteArray()).toEqual(u8(0x7c));
    });

    it(`should allow a value of ${CHAR_MAX - 1}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addChar(CHAR_MAX - 1)).not.toThrow();
    });

    it(`should not allow a value of ${CHAR_MAX}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addChar(CHAR_MAX)).toThrow();
    });
  });

  describe("#addShort()", () => {
    it("should add an encoded 2-byte value", () => {
      const writer = new EoWriter();
      writer.addShort(12345);
      expect(writer.toByteArray()).toEqual(u8(0xca, 0x31));
    });

    it(`should allow a value of ${SHORT_MAX - 1}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addShort(SHORT_MAX - 1)).not.toThrow();
    });

    it(`should not allow a value of ${SHORT_MAX}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addShort(SHORT_MAX)).toThrow();
    });
  });

  describe("#addThree()", () => {
    it("should add an encoded 3-byte value", () => {
      const writer = new EoWriter();
      writer.addThree(10_000_000);
      expect(writer.toByteArray()).toEqual(u8(0xb0, 0x3a, 0x9d));
    });

    it(`should allow a value of ${THREE_MAX - 1}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addThree(THREE_MAX - 1)).not.toThrow();
    });

    it(`should not allow a value of ${THREE_MAX}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addThree(THREE_MAX)).toThrow();
    });
  });

  describe("#addInt()", () => {
    it("should add an encoded 4-byte value", () => {
      const writer = new EoWriter();
      writer.addInt(2_048_576_040);
      expect(writer.toByteArray()).toEqual(u8(0x7f, 0x7f, 0x7f, 0x7f));
    });

    it(`should allow a value of ${INT_MAX - 1}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addInt(INT_MAX - 1)).not.toThrow();
    });

    it(`should not allow a value of ${INT_MAX}`, () => {
      const writer = new EoWriter();
      expect(() => writer.addInt(INT_MAX)).toThrow();
    });
  });

  describe("#addString()", () => {
    it("should add a raw string value", () => {
      const writer = new EoWriter();
      writer.addString("foo");
      expect(writer.toByteArray()).toEqual(u8(0x66, 0x6f, 0x6f));
    });

    it("should add a sanitized raw string value", () => {
      const writer = new EoWriter();
      writer.stringSanitizationMode = true;
      writer.addString("aÿz");
      expect(writer.toByteArray()).toEqual(u8(0x61, 0x79, 0x7a));
    });
  });

  describe("#addFixedString()", () => {
    it("should add a fixed-size raw string value", () => {
      const writer = new EoWriter();
      writer.addFixedString("foo", 3);
      expect(writer.toByteArray()).toEqual(u8(0x66, 0x6f, 0x6f));
    });

    it("should add a fixed-size raw string value with padding", () => {
      const writer = new EoWriter();
      writer.addFixedString("bar", 6, true);
      expect(writer.toByteArray()).toEqual(
        u8(0x62, 0x61, 0x72, 0xff, 0xff, 0xff),
      );
    });

    it("should add a fixed-size raw string value without padding", () => {
      const writer = new EoWriter();
      writer.addFixedString("bar", 3, true);
      expect(writer.toByteArray()).toEqual(u8(0x62, 0x61, 0x72));
    });

    it("should add a sanitized fixed-size raw string value", () => {
      const writer = new EoWriter();
      writer.stringSanitizationMode = true;
      writer.addFixedString("aÿz", 3);
      expect(writer.toByteArray()).toEqual(u8(0x61, 0x79, 0x7a));
    });

    it("should add a sanitized fixed-size raw string value with padding", () => {
      const writer = new EoWriter();
      writer.stringSanitizationMode = true;
      writer.addFixedString("aÿz", 6, true);
      expect(writer.toByteArray()).toEqual(
        u8(0x61, 0x79, 0x7a, 0xff, 0xff, 0xff),
      );
    });

    it("should throw when adding a string that's too long", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedString("foo", 2)).toThrow();
    });

    it("should throw when adding a padded string that's too long", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedString("foo", 2, true)).toThrow();
    });

    it("should throw when adding a string that's too short", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedString("foo", 4)).toThrow();
    });

    it("should allow a padded string that's too short", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedString("foo", 4, true)).not.toThrow();
    });
  });

  describe("#addEncodedString()", () => {
    it("should add an encoded string value", () => {
      const writer = new EoWriter();
      writer.addEncodedString("foo");
      expect(writer.toByteArray()).toEqual(u8(0x5e, 0x30, 0x67));
    });

    it("should add a sanitized encoded string value", () => {
      const writer = new EoWriter();
      writer.stringSanitizationMode = true;
      writer.addEncodedString("aÿz");
      expect(writer.toByteArray()).toEqual(u8(0x53, 0x26, 0x6c));
    });
  });

  describe("#addFixedEncodedString()", () => {
    it("should add a fixed-size encoded string value", () => {
      const writer = new EoWriter();
      writer.addFixedEncodedString("foo", 3);
      expect(writer.toByteArray()).toEqual(u8(0x5e, 0x30, 0x67));
    });

    it("should add a fixed-size encoded string value with padding", () => {
      const writer = new EoWriter();
      writer.addFixedEncodedString("bar", 6, true);
      expect(writer.toByteArray()).toEqual(
        u8(0xff, 0xff, 0xff, 0x2d, 0x6c, 0x3d),
      );
    });

    it("should add a fixed-size encoded string value without padding", () => {
      const writer = new EoWriter();
      writer.addFixedEncodedString("bar", 3, true);
      expect(writer.toByteArray()).toEqual(u8(0x5b, 0x3e, 0x6b));
    });

    it("should add a sanitized fixed-size encoded string value", () => {
      const writer = new EoWriter();
      writer.stringSanitizationMode = true;
      writer.addFixedEncodedString("aÿz", 3);
      expect(writer.toByteArray()).toEqual(u8(0x53, 0x26, 0x6c));
    });

    it("should add a sanitized fixed-size encoded string value with padding", () => {
      const writer = new EoWriter();
      writer.stringSanitizationMode = true;
      writer.addFixedEncodedString("aÿz", 6, true);
      expect(writer.toByteArray()).toEqual(
        u8(0xff, 0xff, 0xff, 0x25, 0x54, 0x3e),
      );
    });

    it("should throw when adding a string that's too long", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedEncodedString("foo", 2)).toThrow();
    });

    it("should throw when adding a padded string that's too long", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedEncodedString("foo", 2, true)).toThrow();
    });

    it("should throw when adding a string that's too short", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedEncodedString("foo", 4)).toThrow();
    });

    it("should allow a padded string that's too short", () => {
      const writer = new EoWriter();
      expect(() => writer.addFixedEncodedString("foo", 4, true)).not.toThrow();
    });
  });

  describe("#stringSanitizationMode", () => {
    it("should return the string sanitization mode", () => {
      const writer = new EoWriter();
      expect(writer.stringSanitizationMode).toBe(false);
      writer.stringSanitizationMode = true;
      expect(writer.stringSanitizationMode).toBe(true);
    });
  });

  describe("#length", () => {
    it("should return the length", () => {
      const writer = new EoWriter();
      expect(writer.length).toBe(0);

      writer.addString("Lorem ipsum dolor sit amet");
      expect(writer.length).toBe(26);

      for (let i = 27; i <= 100; ++i) {
        writer.addByte(0xff);
      }
      expect(writer.length).toBe(100);
    });
  });
});

function u8(...bytes: number[]): Uint8Array {
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; ++i) {
    result[i] = bytes[i];
  }
  return result;
}
