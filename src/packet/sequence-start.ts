import { AbstractSequenceStart } from "./abstract-sequence-start";

/**
 * A value sent by the server to update the client's sequence start, also known as the "starting
 * counter ID".
 */
export interface SequenceStart {
  /**
   * Returns the sequence start value
   *
   * @returns The sequence start value
   */
  get value(): number;
}

export namespace SequenceStart {
  /**
   * Returns an instance of `SequenceStart` with a value of `0`.
   *
   * @returns An instance of `SequenceStart`
   */
  export function zero(): SequenceStart {
    return new ZeroSequenceStart();
  }
}

class ZeroSequenceStart extends AbstractSequenceStart {
  public constructor() {
    super(0);
  }
}
