import { AccountReplySequenceStart } from "@eolib/packet/account-reply-sequence-start";
import { PacketSequencer } from "@eolib/packet/packet-sequencer";

describe("PacketSequencer", () => {
  describe("#nextSequence()", () => {
    it("should increase the counter 9 times and then wrap around", () => {
      const sequenceStart = AccountReplySequenceStart.fromValue(123);
      const sequencer = new PacketSequencer(sequenceStart);

      for (let i = 0; i < 10; ++i) {
        expect(sequencer.nextSequence()).toBe(123 + i);
      }

      expect(sequencer.nextSequence()).toBe(123);
    });
  });

  describe("#sequenceStart", () => {
    it("should update the sequencer start without resetting the counter", () => {
      const sequenceStart = AccountReplySequenceStart.fromValue(100);
      const sequencer = new PacketSequencer(sequenceStart);

      expect(sequencer.nextSequence()).toBe(100);

      sequencer.sequenceStart = AccountReplySequenceStart.fromValue(200);

      expect(sequencer.nextSequence()).toBe(201);
    });
  });
});
