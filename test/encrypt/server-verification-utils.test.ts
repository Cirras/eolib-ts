import { THREE_MAX } from "@eolib/data/eo-numeric-limits";
import { serverVerificationHash } from "@eolib/encrypt/server-verification-utils";

const TEST_DATA = [
  { challenge: 0, hash: 114000 },
  { challenge: 1, hash: 115191 },
  { challenge: 2, hash: 229432 },
  { challenge: 5, hash: 613210 },
  { challenge: 12345, hash: 266403 },
  { challenge: 100_000, hash: 145554 },
  { challenge: 5_000_000, hash: 339168 },
  { challenge: 11_092_003, hash: 112773 },
  { challenge: 11_092_004, hash: 112655 },
  { challenge: 11_092_005, hash: 112299 },
  { challenge: 11_092_110, hash: 11016 },
  { challenge: 11_092_111, hash: -2787 },
  { challenge: 11_111_111, hash: 103749 },
  { challenge: 12_345_678, hash: -32046 },
  { challenge: THREE_MAX - 1, hash: 105960 },
];

describe("serverVerificationHash()", function () {
  TEST_DATA.forEach((data) => {
    it(`should hash ${data.challenge} to ${data.hash}`, function () {
      expect(serverVerificationHash(data.challenge)).toBe(data.hash);
    });
  });
});
