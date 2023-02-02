import { decodeNumber, encodeNumber } from "@eolib/data/number-encoding-utils";

const TEST_DATA = [
  { decoded: 0, encoded: [0x01, 0xfe, 0xfe, 0xfe] },
  { decoded: 1, encoded: [0x02, 0xfe, 0xfe, 0xfe] },
  { decoded: 28, encoded: [0x1d, 0xfe, 0xfe, 0xfe] },
  { decoded: 100, encoded: [0x65, 0xfe, 0xfe, 0xfe] },
  { decoded: 128, encoded: [0x81, 0xfe, 0xfe, 0xfe] },
  { decoded: 252, encoded: [0xfd, 0xfe, 0xfe, 0xfe] },
  { decoded: 253, encoded: [0x01, 0x02, 0xfe, 0xfe] },
  { decoded: 254, encoded: [0x02, 0x02, 0xfe, 0xfe] },
  { decoded: 255, encoded: [0x03, 0x02, 0xfe, 0xfe] },
  { decoded: 32003, encoded: [0x7e, 0x7f, 0xfe, 0xfe] },
  { decoded: 32004, encoded: [0x7f, 0x7f, 0xfe, 0xfe] },
  { decoded: 32005, encoded: [0x80, 0x7f, 0xfe, 0xfe] },
  { decoded: 64008, encoded: [0xfd, 0xfd, 0xfe, 0xfe] },
  { decoded: 64009, encoded: [0x01, 0x01, 0x02, 0xfe] },
  { decoded: 64010, encoded: [0x02, 0x01, 0x02, 0xfe] },
  { decoded: 10_000_000, encoded: [0xb0, 0x3a, 0x9d, 0xfe] },
  { decoded: 16_194_276, encoded: [0xfd, 0xfd, 0xfd, 0xfe] },
  { decoded: 16_194_277, encoded: [0x01, 0x01, 0x01, 0x02] },
  { decoded: 16_194_278, encoded: [0x02, 0x01, 0x01, 0x02] },
  { decoded: 2_048_576_039, encoded: [0x7e, 0x7f, 0x7f, 0x7f] },
  { decoded: 2_048_576_040, encoded: [0x7f, 0x7f, 0x7f, 0x7f] },
  { decoded: 2_048_576_041, encoded: [0x80, 0x7f, 0x7f, 0x7f] },
  { decoded: 4_097_152_079, encoded: [0xfc, 0xfd, 0xfd, 0xfd] },
  { decoded: 4_097_152_080, encoded: [0xfd, 0xfd, 0xfd, 0xfd] },
];

describe("encodeNumber()", function () {
  TEST_DATA.forEach((data) => {
    it(`should encode ${data.decoded} to [${data.encoded.join(
      ", "
    )}]`, function () {
      expect(encodeNumber(data.decoded)).toEqual(new Uint8Array(data.encoded));
    });
  });
});

describe("decodeNumber()", function () {
  TEST_DATA.forEach((data) => {
    it(`should decode [${data.encoded.join(", ")}] to ${
      data.decoded
    }`, function () {
      expect(decodeNumber(new Uint8Array(data.encoded))).toEqual(data.decoded);
    });
  });
});
