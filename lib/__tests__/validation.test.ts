import { describe, expect, it } from "vitest";
import {
  CUSTOMER_MAX,
  NOTES_MAX,
  TITLE_MAX,
  UnsafeInputError,
  sanitizeText,
} from "@/lib/validation";

describe("sanitizeText", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeText("   hello   ", TITLE_MAX)).toBe("hello");
  });

  it("truncates to the provided maxLength", () => {
    const s = "a".repeat(200);
    const out = sanitizeText(s, 50);
    expect(out.length).toBe(50);
  });

  it("strips control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)", () => {
    const input = "hello\x00\x01\x02world\x7F";
    expect(sanitizeText(input, TITLE_MAX)).toBe("helloworld");
  });

  it("keeps newlines and tabs as legitimate whitespace", () => {
    const input = "line1\nline2\tcol";
    // after trim the internal \n and \t survive.
    expect(sanitizeText(input, NOTES_MAX)).toBe("line1\nline2\tcol");
  });

  it("throws UnsafeInputError when the value contains <script", () => {
    expect(() => sanitizeText("<script>alert(1)</script>", NOTES_MAX)).toThrow(
      UnsafeInputError
    );
  });

  it("throws UnsafeInputError when the value contains <iframe (case-insensitive)", () => {
    expect(() =>
      sanitizeText("<IFRAME src='evil'></IFRAME>", NOTES_MAX)
    ).toThrow(UnsafeInputError);
  });

  it("returns empty string for non-string input without throwing", () => {
    // @ts-expect-error deliberate misuse
    expect(sanitizeText(undefined, TITLE_MAX)).toBe("");
    // @ts-expect-error deliberate misuse
    expect(sanitizeText(42, TITLE_MAX)).toBe("");
  });

  it("does not throw on strings that merely contain the word 'script'", () => {
    // "no script" does not include the "<script" prefix, so it's allowed.
    expect(sanitizeText("no script tag here", NOTES_MAX)).toBe(
      "no script tag here"
    );
  });

  it("exposes the documented length caps", () => {
    expect(TITLE_MAX).toBe(100);
    expect(CUSTOMER_MAX).toBe(80);
    expect(NOTES_MAX).toBe(500);
  });
});
