import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// These tests are intentionally source-level assertions rather than full
// render tests. They protect a small number of concrete accessibility fixes
// from regressing during unrelated refactors. If these fail, re-read the
// "Accessibility" section of the README before deleting or loosening them.

const repoRoot = path.resolve(__dirname, "..", "..");

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), "utf8");
}

describe("a11y canaries", () => {
  it("layout exposes a skip-to-main-content link", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toMatch(/href="#main-content"/);
    expect(layout).toMatch(/Skip to main content/);
  });

  it("each top-level main element carries id=main-content", () => {
    for (const rel of [
      "app/page.tsx",
      "app/dashboard/page.tsx",
      "app/upload/page.tsx",
    ]) {
      const src = read(rel);
      expect(src, `${rel} missing id="main-content" on <main>`).toMatch(
        /<main[^>]*id="main-content"/
      );
    }
  });

  it("new-order button has an aria-label", () => {
    const src = read("app/dashboard/orders-list.tsx");
    expect(src).toMatch(/aria-label=\{showForm \? "Cancel new order" : "Create a new order"\}/);
  });

  it("dashboard exposes a live region for flash and toast updates", () => {
    const src = read("app/dashboard/orders-list.tsx");
    expect(src).toMatch(/role="status"/);
    expect(src).toMatch(/aria-live="polite"/);
  });

  it("upload dropzone uses a real button element, not a div onclick", () => {
    const src = read("app/upload/page.tsx");
    // The dropzone wrapper div should no longer have its own onClick.
    expect(src).not.toMatch(/<div[\s\S]{0,400}onClick=\{\(\) => inputRef.current\?\.click\(\)\}/);
    // The click target should be a <button type="button">.
    expect(src).toMatch(/<button\s+type="button"\s+onClick=\{\(\) => inputRef\.current\?\.click\(\)\}/);
  });

  it("filter form inputs have associated labels", () => {
    const src = read("app/dashboard/orders-list.tsx");
    expect(src).toMatch(/htmlFor="filter-q"/);
    expect(src).toMatch(/htmlFor="filter-status"/);
  });
});
