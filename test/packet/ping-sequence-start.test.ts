import { PingSequenceStart } from "@eolib/packet/ping-sequence-start";

const VALUE = 879;
const SEQ1 = 1005;
const SEQ2 = 126;

describe("PingSequenceStart", () => {
  describe("#fromValue()", () => {
    it("should return the value provided at construction", () => {
      const sequenceStart = PingSequenceStart.fromPingValues(SEQ1, SEQ2);
      expect(sequenceStart.value).toBe(VALUE);
      expect(sequenceStart.seq1).toBe(SEQ1);
      expect(sequenceStart.seq2).toBe(SEQ2);
    });
  });

  describe("#generate()", () => {
    it("should generate a random sequence start between 0 and 1757", () => {
      jest.spyOn(global.Math, "random").mockReturnValue(0.5);

      const sequenceStart = PingSequenceStart.generate();
      expect(sequenceStart.value).toBe(VALUE);
      expect(sequenceStart.seq1).toBe(SEQ1);
      expect(sequenceStart.seq2).toBe(SEQ2);

      jest.spyOn(global.Math, "random").mockRestore();
    });
  });
});
