import { CHAR_MAX } from "@eolib/data/eo-numeric-limits";
import { AbstractSequenceStart } from "./abstract-sequence-start";
import { randBetween } from "./random-utils";

/**
 * A class representing the sequence start value sent with the INIT_INIT server packet.
 *
 * @see
 * {@link InitInitServerPacket}
 */
export class InitSequenceStart extends AbstractSequenceStart {
  private readonly _seq1: number;
  private readonly _seq2: number;

  private constructor(value: number, seq1: number, seq2: number) {
    super(value);
    this._seq1 = seq1;
    this._seq2 = seq2;
  }

  /**
   * Returns the seq1 byte value sent with the INIT_INIT server packet.
   *
   * @returns The seq1 byte value
   *
   * @see
   * {@link InitInitServerPacket.ReplyCodeDataOk.seq1}
   */
  public get seq1(): number {
    return this._seq1;
  }

  /**
   * Returns the seq2 byte value sent with the INIT_INIT server packet.
   *
   * @returns The seq2 byte value
   *
   * @see
   * {@link InitInitServerPacket.ReplyCodeDataOk.seq2}
   */
  public get seq2(): number {
    return this._seq2;
  }

  /**
   * Creates an instance of `InitSequenceStart` from the values sent with the INIT_INIT server
   * packet.
   *
   * @param seq1 - the seq1 byte value sent with the INIT_INIT server packet
   * @param seq2 - the seq2 byte value sent with the INIT_INIT server packet
   * @returns An instance of `InitSequenceStart`
   *
   * @see
   * <ul>
   *   <li>{@link InitInitServerPacket.ReplyCodeDataOk.seq1}
   *   <li>{@link InitInitServerPacket.ReplyCodeDataOk.seq2}
   * </ul>
   */
  public static fromInitValues(seq1: number, seq2: number): InitSequenceStart {
    const value = seq1 * 7 + seq2 - 13;
    return new InitSequenceStart(value, seq1, seq2);
  }

  /**
   * Generates an instance of `InitSequenceStart` with a random value in the range `0-1757`.
   *
   * @returns An instance of `InitSequenceStart`
   */
  public static generate(): InitSequenceStart {
    const value = randBetween(0, 1757);
    const seq1Max = Math.trunc((value + 13) / 7);
    const seq1Min = Math.max(
      0,
      Math.trunc((value - (CHAR_MAX - 1) + 13 + 6) / 7),
    );

    const seq1 = randBetween(0, seq1Max - seq1Min) + seq1Min;
    const seq2 = value - seq1 * 7 + 13;

    return new InitSequenceStart(value, seq1, seq2);
  }
}
