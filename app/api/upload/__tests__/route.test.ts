import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/upload/route";

function makeRequest(body: FormData): Request {
  // undici/Node 18+ Request accepts a FormData body and infers the
  // multipart boundary automatically.
  return new Request("http://localhost/api/upload", {
    method: "POST",
    body,
  });
}

function fileFrom(name: string, content: string, type: string): File {
  return new File([content], name, { type });
}

describe("POST /api/upload", () => {
  it("returns {columns, rowCount, mappableCount, preview, rows} for a valid CSV", async () => {
    const csv = [
      "title,customer,status,priority",
      "Install HVAC,Acme,pending,high",
      "Repair leak,Beta Co,completed,low",
    ].join("\n");

    const form = new FormData();
    form.append("file", fileFrom("jobs.csv", csv, "text/csv"));

    const res = await POST(makeRequest(form));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.columns)).toBe(true);
    expect(body.columns).toEqual(["title", "customer", "status", "priority"]);
    expect(body.rowCount).toBe(2);
    expect(body.mappableCount).toBe(2);
    expect(Array.isArray(body.preview)).toBe(true);
    expect(body.preview.length).toBeGreaterThan(0);
    expect(Array.isArray(body.rows)).toBe(true);
    expect(body.rows.length).toBe(2);
  });

  it("returns 415 for a non-CSV file extension", async () => {
    const form = new FormData();
    form.append(
      "file",
      fileFrom("notes.txt", "just a text file", "text/plain")
    );

    const res = await POST(makeRequest(form));
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(typeof body.error).toBe("string");
  });

  it("returns 400 when no file field is attached", async () => {
    const form = new FormData();
    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe("string");
  });

  it("returns 400 for an empty CSV (header only, no rows)", async () => {
    const form = new FormData();
    form.append(
      "file",
      fileFrom("empty.csv", "title,customer\n", "text/csv")
    );

    const res = await POST(makeRequest(form));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(typeof body.error).toBe("string");
  });

  it("counts only mappable rows (rows with a title column) in mappableCount", async () => {
    const csv = [
      "customer,notes",
      "Acme,no title column here",
      "Beta,still no title",
    ].join("\n");

    const form = new FormData();
    form.append("file", fileFrom("bad.csv", csv, "text/csv"));

    const res = await POST(makeRequest(form));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rowCount).toBe(2);
    expect(body.mappableCount).toBe(0);
  });
});
