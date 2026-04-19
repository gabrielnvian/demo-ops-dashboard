import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("respects conditional object syntax from clsx", () => {
    expect(cn("a", { b: true, c: false })).toBe("a b");
  });

  it("dedupes conflicting Tailwind classes via tailwind-merge", () => {
    // later class should win when both target the same utility
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
