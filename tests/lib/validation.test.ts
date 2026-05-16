import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPassword, isValidUuid } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
  });
  it("rejects malformed", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("accepts ≥8 chars", () => {
    expect(isValidPassword("password123")).toBe(true);
  });
  it("rejects <8 chars", () => {
    expect(isValidPassword("short")).toBe(false);
  });
});

describe("isValidUuid", () => {
  it("accepts v4-shaped UUID", () => {
    expect(isValidUuid("11111111-2222-3333-4444-555555555555")).toBe(true);
  });
  it("rejects malformed", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("11111111-2222-3333-4444-55555555555")).toBe(false);
  });
});
