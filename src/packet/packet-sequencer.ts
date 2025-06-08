import { SequenceStart } from "./sequence-start.js";

/** A class for generating packet sequences. */
export class PacketSequencer {
  private start: SequenceStart;
  private counter = 0;

  /**
   * Constructs a new PacketSequencer with the provided SequenceStart.
   *
   * @param start - the sequence start
   */
  constructor(start: SequenceStart) {
    this.start = start;
  }

  /**
   * Returns the next sequence value, updating the sequence counter in the process.
   *
   * @remarks
   * This is not a monotonic operation. The sequence counter increases from 0 to 9 before looping back around to 0.
   *
   * @returns the next sequence value
   */
  public nextSequence(): number {
    const result = this.start.value + this.counter;
    this.counter = (this.counter + 1) % 10;
    return result;
  }

  /**
   * Sets the sequence start, also known as the "starting counter ID".
   *
   * @remarks
   * This does not reset the sequence counter.
   *
   * @param start - the new sequence start
   */
  public set sequenceStart(start: SequenceStart) {
    this.start = start;
  }
}
