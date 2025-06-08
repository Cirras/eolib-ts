import { AccountReplySequenceStart } from "@eolib/packet/account-reply-sequence-start.js";

describe("AccountReplySequenceStart", () => {
  describe("#fromValue()", () => {
    it("should return the value provided at construction", () => {
      const sequenceStart = AccountReplySequenceStart.fromValue(22);
      expect(sequenceStart.value).toBe(22);
    });
  });

  describe("#generate()", () => {
    it("should generate a random sequence start between 0 and 240", () => {
      jest.spyOn(global.Math, "random").mockReturnValue(0.5);

      const sequenceStart = AccountReplySequenceStart.generate();
      expect(sequenceStart.value).toBe(120);

      jest.spyOn(global.Math, "random").mockRestore();
    });
  });
});
