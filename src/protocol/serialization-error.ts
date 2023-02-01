/**
 * Represents an error in serializing a protocol data structure.
 */
export class SerializationError extends Error {
  /**
   * Constructs a `SerializationError` with the specified error message.
   *
   * @param message - the error message
   */
  public constructor(message: string) {
    super(message);
  }
}
