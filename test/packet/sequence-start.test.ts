import { SequenceStart } from "@eolib/packet/sequence-start.js";

import { describe, it, expect } from "vitest";

describe("SequenceStart", () => {
  describe("#zero()", () => {
    it("should have a value of 0", () => {
      expect(SequenceStart.zero().value).toBe(0);
    });
  });
});
