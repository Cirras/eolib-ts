import type { SequenceStart } from "./sequence-start";

/**
 * A value sent by the server to update the client's sequence start, also known as the "starting
 * counter ID".
 */
export abstract class AbstractSequenceStart implements SequenceStart {
  private readonly _value: number;

  protected constructor(value: number) {
    this._value = value;
  }

  public get value(): number {
    return this._value;
  }
}
