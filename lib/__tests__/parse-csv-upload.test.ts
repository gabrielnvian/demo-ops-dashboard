import { describe, it, expect } from "vitest";
import { parseCsvUpload } from "@/lib/parse-csv-upload";

function fileFrom(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

describe("parseCsvUpload", () => {
  it("returns {columns, rowCount, mappableCount, preview, mappedRows} for a valid CSV", async () => {
    const csv = [
      "title,customer,status,priority",
      "Install HVAC,Acme,pending,high",
      "Repair leak,Beta Co,completed,low",
    ].join("\n");

    const file = fileFrom("jobs.csv", csv, "text/csv");
    const result = await parseCsvUpload(file, file.name, file.size);

    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(Array.isArray(result.columns)).toBe(true);
    expect(result.columns).toEqual(["title", "customer", "status", "priority"]);
    expect(result.rowCount).toBe(2);
    expect(result.mappableCount).toBe(2);
    expect(Array.isArray(result.preview)).toBe(true);
    expect(result.preview.length).toBeGreaterThan(0);
    expect(Array.isArray(result.mappedRows)).toBe(true);
    expect(result.mappedRows.length).toBe(2);
    // Each mapped row should carry the fields the dashboard renders.
    const first = result.mappedRows[0];
    expect(first.title).toBe("Install HVAC");
    expect(first.customer).toBe("Acme");
    expect(first.status).toBe("PENDING");
    // Unknown "priority" column is preserved in notes per csv-mapping.
    expect(first.notes).toContain("priority: high");
  });

  it("returns a ParseError with status 415 for a non-CSV file extension", async () => {
    const file = fileFrom("notes.txt", "just a text file", "text/plain");
    const result = await parseCsvUpload(file, file.name, file.size);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.status).toBe(415);
    expect(typeof result.error).toBe("string");
  });

  it("returns a ParseError with status 400 for an empty CSV (header only, no rows)", async () => {
    const file = fileFrom("empty.csv", "title,customer\n", "text/csv");
    const result = await parseCsvUpload(file, file.name, file.size);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.status).toBe(400);
    expect(typeof result.error).toBe("string");
  });

  it("counts only mappable rows (rows with a title column) in mappableCount", async () => {
    const csv = [
      "customer,notes",
      "Acme,no title column here",
      "Beta,still no title",
    ].join("\n");

    const file = fileFrom("bad.csv", csv, "text/csv");
    const result = await parseCsvUpload(file, file.name, file.size);

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.rowCount).toBe(2);
    expect(result.mappableCount).toBe(0);
    expect(Array.isArray(result.mappedRows)).toBe(true);
    expect(result.mappedRows.length).toBe(0);
  });

  it("serializes dueAt as an ISO string in mappedRows", async () => {
    const csv = [
      "title,dueAt",
      "With date,2026-05-01",
      "Without date,",
    ].join("\n");
    const file = fileFrom("dated.csv", csv, "text/csv");
    const result = await parseCsvUpload(file, file.name, file.size);

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.mappedRows[0].dueAt).toMatch(/^2026-05-01/);
    expect(result.mappedRows[1].dueAt).toBeNull();
  });

  it("returns a ParseError with status 413 for a file exceeding the size limit", async () => {
    const file = fileFrom("big.csv", "title\nsome title", "text/csv");
    // Pass a fake size that exceeds MAX_BYTES (5MB)
    const result = await parseCsvUpload(file, file.name, 6 * 1024 * 1024);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.status).toBe(413);
  });
});
