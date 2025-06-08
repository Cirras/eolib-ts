import { InitSequenceStart } from "@eolib/packet/init-sequence-start.js";

const VALUE = 879;
const SEQ1 = 110;
const SEQ2 = 122;

describe("InitSequenceStart", () => {
  describe("#fromValue()", () => {
    it("should return the value provided at construction", () => {
      const sequenceStart = InitSequenceStart.fromInitValues(SEQ1, SEQ2);
      expect(sequenceStart.value).toBe(VALUE);
      expect(sequenceStart.seq1).toBe(SEQ1);
      expect(sequenceStart.seq2).toBe(SEQ2);
    });
  });

  describe("#generate()", () => {
    it("should generate a random sequence start between 0 and 1757", () => {
      jest.spyOn(global.Math, "random").mockReturnValue(0.5);

      const sequenceStart = InitSequenceStart.generate();
      expect(sequenceStart.value).toBe(VALUE);
      expect(sequenceStart.seq1).toBe(SEQ1);
      expect(sequenceStart.seq2).toBe(SEQ2);

      jest.spyOn(global.Math, "random").mockRestore();
    });
  });
});
