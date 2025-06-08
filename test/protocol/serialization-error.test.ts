import { SerializationError } from "@eolib/index.js";

describe("SerializationError", () => {
  describe("#message", () => {
    it("should return the message provided at construction", () => {
      const message = "Oh no, the sun exploded!";
      expect(new SerializationError(message).message).toStrictEqual(message);
    });
  });
});
