import { AbstractSequenceStart } from "./abstract-sequence-start.js";
import { randBetween } from "./random-utils.js";

/**
 * A class representing the sequence start value sent with the ACCOUNT_REPLY server packet.
 *
 * @see
 * {@link AccountReplyServerPacket}
 */
export class AccountReplySequenceStart extends AbstractSequenceStart {
  private constructor(value: number) {
    super(value);
  }

  /**
   * Creates an instance of `AccountReplySequenceStart` from the value sent with the ACCOUNT_REPLY
   * server packet.
   *
   * @param value - the sequence_start char value sent with the ACCOUNT_REPLY server packet
   *
   * @see
   * {@link AccountReplyServerPacket.ReplyCodeDataDefault.sequenceStart}
   */
  public static fromValue(value: number): AccountReplySequenceStart {
    return new AccountReplySequenceStart(value);
  }

  /**
   * Generates an instance of AccountReplySequenceStart with a random value in the range `0-240`.
   *
   * @returns An instance of `AccountReplySequenceStart`
   */
  public static generate(): AccountReplySequenceStart {
    return new AccountReplySequenceStart(randBetween(0, 240));
  }
}
