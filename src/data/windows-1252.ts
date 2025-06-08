// Unicode and Windows-1252 are both supersets of ISO-8859-1 (latin-1).
// The only difference is that Windows-1252 maps characters in the 0x80-0x9F range, while this range
// is undefined in ISO-8859-1.
const WIN1252_TABLE = [
  0x20ac, // 0x80 €
  0xfffd, // 0x81 undefined
  0x201a, // 0x82 ‚
  0x0192, // 0x83 ƒ
  0x201e, // 0x84 „
  0x2026, // 0x85 …
  0x2020, // 0x86 †
  0x2021, // 0x87 ‡
  0x02c6, // 0x88 ˆ
  0x2030, // 0x89 ‰
  0x0160, // 0x8A Š
  0x2039, // 0x8B ‹
  0x0152, // 0x8C Œ
  0xfffd, // 0x8D undefined
  0x017d, // 0x8E Ž
  0xfffd, // 0x8F undefined
  0xfffd, // 0x90 undefined
  0x2018, // 0x91 ‘
  0x2019, // 0x92 ’
  0x201c, // 0x93 “
  0x201d, // 0x94 ”
  0x2022, // 0x95 •
  0x2013, // 0x96 –
  0x2014, // 0x97 —
  0x02dc, // 0x98 ˜
  0x2122, // 0x99 ™
  0x0161, // 0x9A š
  0x203a, // 0x9B ›
  0x0153, // 0x9C œ
  0xfffd, // 0x9D undefined
  0x017e, // 0x9E ž
  0x0178, // 0x9F Ÿ
];

export function encode1252(str: string): Uint8Array {
  const result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    const code = str.charCodeAt(i);
    let byte: number;
    if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) {
      byte = code;
    } else {
      const index = WIN1252_TABLE.indexOf(code);
      if (index !== -1) {
        byte = 0x80 + index;
      } else {
        byte = 0x3f; // replacement character
      }
    }
    result[i] = byte;
  }
  return result;
}

export function decode1252(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) {
    let code: number;
    if (byte < 0x80 || (byte >= 0xa0 && byte <= 0xff)) {
      code = byte;
    } else {
      code = WIN1252_TABLE[byte - 0x80];
    }
    result += String.fromCharCode(code);
  }
  return result;
}
