// As for why we're declaring our own types for this library...
// - https://github.com/mathiasbynens/windows-1252/issues/9
// - https://github.com/mathiasbynens/windows-1252/issues/10

declare module "windows-1252" {
  type EncodeOptions = {
    mode: "fatal" | "replacement";
  };
  type DecodeOptions = {
    mode: "fatal" | "replacement";
  };

  export function encode(text: string, options?: EncodeOptions): Uint16Array;
  export function decode(
    buffer: Uint16Array | Uint8Array | Buffer | string,
    options?: DecodeOptions
  ): string;
  export type labels = string[];
}
