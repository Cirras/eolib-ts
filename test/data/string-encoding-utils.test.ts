import {
  decodeString,
  encodeString,
} from "@eolib/data/string-encoding-utils.js";
import { encode1252 } from "@eolib/data/windows-1252.js";

const TEST_DATA = [
  {
    decoded: "Hello, World!",
    encoded: "!;a-^H s^3a:)",
  },
  {
    decoded: "We're ¼ of the way there, so ¾ is remaining.",
    encoded: "C8_6_6l2h- ,d ¾ ^, sh-h7Y T>V h7Y g0 ¼ :[xhH",
  },
  {
    decoded: "64² = 4096",
    encoded: ";fAk b ²=i",
  },
  {
    decoded: "© FÒÖ BÃR BÅZ 2014",
    encoded: "=nAm EÅ] MÃ] ÖÒY ©",
  },
  {
    decoded: 'Öxxö Xööx "Lëïth Säë" - "Ÿ"',
    encoded: "OŸO D OëäL 7YïëSO UööG öU'Ö",
  },
  {
    decoded: "Padded with 0xFFÿÿÿÿÿÿÿÿ",
    encoded: "ÿÿÿÿÿÿÿÿ+YUo 7Y6V i:i;lO",
  },
];

describe("encodeString()", () => {
  TEST_DATA.forEach((data) => {
    it(`should encode "${data.decoded}" to "${data.encoded}"`, () => {
      const bytes = encode1252(data.decoded);
      encodeString(bytes);
      expect(bytes).toEqual(encode1252(data.encoded));
    });
  });
});

describe("decodeString()", function () {
  TEST_DATA.forEach((data) => {
    it(`should decode "${data.encoded}" to "${data.decoded}"`, function () {
      const bytes = encode1252(data.encoded);
      decodeString(bytes);
      expect(bytes).toEqual(encode1252(data.decoded));
    });
  });
});
