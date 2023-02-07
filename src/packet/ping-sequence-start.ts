import { CHAR_MAX } from "@eolib/data/eo-numeric-limits";
import { AbstractSequenceStart } from "./abstract-sequence-start";
import { randBetween } from "./random-utils";

/**
 * A class representing the sequence start value sent with the CONNECTION_PLAYER server packet.
 *
 * @see
 * {@link ConnectionPlayerServerPacket}
 */
export class PingSequenceStart extends AbstractSequenceStart {
  private readonly _seq1: number;
  private readonly _seq2: number;

  private constructor(value: number, seq1: number, seq2: number) {
    super(value);
    this._seq1 = seq1;
    this._seq2 = seq2;
  }

  /**
   * Returns the seq1 short value sent with the CONNECTION_PLAYER server packet.
   *
   * @returns The seq1 short value
   *
   * @see
   * {@link ConnectionPlayerServerPacket.seq1}
   */
  public get seq1(): number {
    return this._seq1;
  }

  /**
   * Returns the seq2 char value sent with the CONNECTION_PLAYER server packet.
   *
   * @returns The seq2 char value
   *
   * @see
   * {@link ConnectionPlayerServerPacket.seq1}
   */
  public get seq2(): number {
    return this._seq2;
  }

  /**
   * Creates an instance of `PingSequenceStart` from the values sent with the CONNECTION_PLAYER
   * server packet.
   *
   * @param seq1 - the seq1 short value sent with the CONNECTION_PLAYER server packet
   * @param seq2 - the seq2 char value sent with the CONNECTION_PLAYER server packet
   * @returns An instance of `PingSequenceStart`
   *
   * @see
   * <ul>
   *   <li>{@link ConnectionPlayerServerPacket.seq1}
   *   <li>{@link ConnectionPlayerServerPacket.seq2}
   * </ul>
   */
  public static fromPingValues(seq1: number, seq2: number): PingSequenceStart {
    const value = seq1 - seq2;
    return new PingSequenceStart(value, seq1, seq2);
  }

  /**
   * Generates an instance of `PingSequenceStart` with a random value in the range `0-1757`.
   *
   * @returns An instance of `PingSequenceStart`
   */
  public static generate(): PingSequenceStart {
    const value = randBetween(0, 1757);
    const seq1 = value + randBetween(0, CHAR_MAX - 1);
    const seq2 = seq1 - value;

    return new PingSequenceStart(value, seq1, seq2);
  }
}
