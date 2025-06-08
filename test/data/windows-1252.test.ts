import { encode1252, decode1252 } from "@eolib/data/windows-1252";

describe("encode1252", () => {
  it("encodes ASCII characters (0x00-0x7F)", () => {
    expect(encode1252("\u0000abc123\u007F")).toEqual(
      new Uint8Array([0x00, 0x61, 0x62, 0x63, 0x31, 0x32, 0x33, 0x7f]),
    );
  });

  it("encodes upper-range characters (0xA0-0xFF)", () => {
    expect(encode1252("\u00A0¢¶ÂÊÖæ÷ÿ")).toEqual(
      new Uint8Array([0xa0, 0xa2, 0xb6, 0xc2, 0xca, 0xd6, 0xe6, 0xf7, 0xff]),
    );
  });

  it("encodes latin-1 unmapped characters (0x80-0x9F)", () => {
    expect(encode1252("€…ŒŸ")).toEqual(
      new Uint8Array([0x80, 0x85, 0x8c, 0x9f]),
    );
  });

  it("encodes unmapped characters to 0x3F", () => {
    expect(encode1252("Ā😀")).toEqual(new Uint8Array([0x3f, 0x3f, 0x3f]));
  });

  it("encodes strings with mixed characters", () => {
    expect(encode1252("A€ĀŸ😀")).toEqual(
      new Uint8Array([
        0x41, // A
        0x80, // €
        0x3f, // Ā (unmapped)
        0x9f, // Ÿ
        0x3f, // 😀 (unmapped)
        0x3f, // 😀 (unmapped)
      ]),
    );
  });
});

describe("decode1252", () => {
  it("decodes ASCII bytes (0x00-0x7F)", () => {
    const bytes = new Uint8Array([
      0x00, 0x61, 0x62, 0x63, 0x31, 0x32, 0x33, 0x7f,
    ]);
    expect(decode1252(bytes)).toBe("\u0000abc123\u007F");
  });

  it("decodes upper-range characters (0xA0-0xFF)", () => {
    const bytes = new Uint8Array([
      0xa0, 0xa2, 0xb6, 0xc2, 0xca, 0xd6, 0xe6, 0xf7, 0xff,
    ]);
    expect(decode1252(bytes)).toBe("\u00A0¢¶ÂÊÖæ÷ÿ");
  });

  it("decodes latin-1 unmapped characters (0x80-0x9F)", () => {
    const bytes = new Uint8Array([0x80, 0x85, 0x8c, 0x9f]);
    const decoded = decode1252(bytes);
    expect(decoded).toBe("€…ŒŸ");
  });

  it("decodes unmapped bytes to replacement character", () => {
    const bytes = new Uint8Array([0x81, 0x8d, 0x8f, 0x90, 0x9d]);
    expect(decode1252(bytes)).toBe("\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD");
  });
});
