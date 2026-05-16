import { describe, it, expect } from "vitest";
import { decodeJSON, encodeJSON, CodecError } from "@/lib/codec";

describe("decodeJSON", () => {
  it("decodes valid base64 JSON", () => {
    const b64 = btoa('{"text":"hello","n":42}');
    expect(decodeJSON(b64)).toEqual({ text: "hello", n: 42 });
  });

  it("throws CodecError on malformed base64", () => {
    expect(() => decodeJSON("not!base64!@#")).toThrow(CodecError);
  });

  it("throws CodecError on non-JSON content", () => {
    const b64 = btoa("plain text not json");
    expect(() => decodeJSON(b64)).toThrow(/invalid JSON/);
  });

  it("throws CodecError on empty string", () => {
    expect(() => decodeJSON("")).toThrow(CodecError);
  });

  it("throws CodecError when passed non-string", () => {
    // @ts-expect-error testing runtime guard
    expect(() => decodeJSON(123)).toThrow(/expected string/);
  });

  it("round-trips encode/decode", () => {
    const value = { a: 1, b: [2, 3], c: { nested: true } };
    expect(decodeJSON(encodeJSON(value))).toEqual(value);
  });
});
