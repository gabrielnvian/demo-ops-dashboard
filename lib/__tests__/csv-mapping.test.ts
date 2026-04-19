import { describe, it, expect } from "vitest";
import { mapRow, MAX_ROWS, MAX_BYTES } from "@/lib/csv-mapping";

describe("mapRow - title column detection", () => {
  it("maps 'Title' (mixed case) to title", () => {
    const result = mapRow({ Title: "Install HVAC" });
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Install HVAC");
  });

  it("maps 'TITLE' (uppercase) to title", () => {
    const result = mapRow({ TITLE: "Repair pipe" });
    expect(result!.title).toBe("Repair pipe");
  });

  it("maps 'title' (lowercase) to title", () => {
    const result = mapRow({ title: "Paint wall" });
    expect(result!.title).toBe("Paint wall");
  });

  it("maps 'order' header to title (synonym)", () => {
    const result = mapRow({ order: "Order #42" });
    expect(result!.title).toBe("Order #42");
  });

  it("maps 'job', 'name', 'description' headers to title", () => {
    expect(mapRow({ job: "A" })!.title).toBe("A");
    expect(mapRow({ name: "B" })!.title).toBe("B");
    expect(mapRow({ description: "C" })!.title).toBe("C");
  });

  it("returns null when no title-like column is present", () => {
    const result = mapRow({ customer: "Acme", notes: "no title here" });
    expect(result).toBeNull();
  });

  it("trims whitespace around title values", () => {
    const result = mapRow({ title: "   Padded Title   " });
    expect(result!.title).toBe("Padded Title");
  });
});

describe("mapRow - status parsing", () => {
  it("accepts lowercase 'pending' and maps to PENDING", () => {
    const result = mapRow({ title: "T", status: "pending" });
    expect(result!.status).toBe("PENDING");
  });

  it("accepts 'PENDING' uppercase as-is", () => {
    const result = mapRow({ title: "T", status: "PENDING" });
    expect(result!.status).toBe("PENDING");
  });

  it("accepts mixed case 'Completed'", () => {
    const result = mapRow({ title: "T", status: "Completed" });
    expect(result!.status).toBe("COMPLETED");
  });

  it("accepts 'in progress' with space and normalizes to IN_PROGRESS", () => {
    const result = mapRow({ title: "T", status: "in progress" });
    expect(result!.status).toBe("IN_PROGRESS");
  });

  it("accepts 'in-progress' with hyphen and normalizes to IN_PROGRESS", () => {
    const result = mapRow({ title: "T", status: "in-progress" });
    expect(result!.status).toBe("IN_PROGRESS");
  });

  it("defaults to PENDING when status is an invalid value", () => {
    const result = mapRow({ title: "T", status: "foo" });
    expect(result!.status).toBe("PENDING");
  });

  it("defaults to PENDING when status is empty string", () => {
    const result = mapRow({ title: "T", status: "" });
    expect(result!.status).toBe("PENDING");
  });

  it("defaults to PENDING when status column is absent", () => {
    const result = mapRow({ title: "T" });
    expect(result!.status).toBe("PENDING");
  });
});

describe("mapRow - customer default", () => {
  it("defaults missing customer to 'Unknown'", () => {
    const result = mapRow({ title: "T" });
    expect(result!.customer).toBe("Unknown");
  });

  it("defaults empty customer field to 'Unknown'", () => {
    const result = mapRow({ title: "T", customer: "" });
    expect(result!.customer).toBe("Unknown");
  });

  it("uses provided customer value when present", () => {
    const result = mapRow({ title: "T", customer: "Acme Corp" });
    expect(result!.customer).toBe("Acme Corp");
  });

  it("accepts 'client', 'company', 'account' as customer synonyms", () => {
    expect(mapRow({ title: "T", client: "Alpha" })!.customer).toBe("Alpha");
    expect(mapRow({ title: "T", company: "Beta" })!.customer).toBe("Beta");
    expect(mapRow({ title: "T", account: "Gamma" })!.customer).toBe("Gamma");
  });
});

describe("mapRow - unrecognized columns go to notes", () => {
  it("appends unknown 'priority' column to notes as 'priority: <value>'", () => {
    const result = mapRow({ title: "T", priority: "high" });
    expect(result!.notes).toContain("priority: high");
  });

  it("preserves multiple unknown columns in notes", () => {
    const result = mapRow({
      title: "T",
      priority: "high",
      region: "EU",
    });
    expect(result!.notes).toContain("priority: high");
    expect(result!.notes).toContain("region: EU");
  });

  it("puts recognized notes column before extra unknown-column lines", () => {
    const result = mapRow({
      title: "T",
      notes: "Main note",
      priority: "low",
    });
    expect(result!.notes).not.toBeNull();
    const lines = result!.notes!.split("\n");
    expect(lines[0]).toBe("Main note");
    expect(lines.some((l) => l === "priority: low")).toBe(true);
  });

  it("leaves notes as null when no notes or extras are present", () => {
    const result = mapRow({ title: "T", customer: "Acme" });
    expect(result!.notes).toBeNull();
  });

  it("skips empty-valued unknown columns", () => {
    const result = mapRow({ title: "T", priority: "", region: "US" });
    expect(result!.notes).toBe("region: US");
  });
});

describe("mapRow - date parsing for dueAt", () => {
  it("parses ISO date", () => {
    const result = mapRow({ title: "T", dueAt: "2026-01-15" });
    expect(result!.dueAt).toBeInstanceOf(Date);
    expect(result!.dueAt!.getUTCFullYear()).toBe(2026);
    expect(result!.dueAt!.getUTCMonth()).toBe(0);
    expect(result!.dueAt!.getUTCDate()).toBe(15);
  });

  it("parses ISO datetime", () => {
    const result = mapRow({
      title: "T",
      due_date: "2026-01-15T10:00:00Z",
    });
    expect(result!.dueAt).toBeInstanceOf(Date);
    expect(result!.dueAt!.toISOString()).toBe("2026-01-15T10:00:00.000Z");
  });

  it("parses a US-style date string accepted by Date constructor", () => {
    const result = mapRow({ title: "T", deadline: "Jan 15, 2026" });
    expect(result!.dueAt).toBeInstanceOf(Date);
    expect(result!.dueAt!.getFullYear()).toBe(2026);
  });

  it("returns null for unparseable date strings", () => {
    const result = mapRow({ title: "T", dueAt: "not a date" });
    expect(result!.dueAt).toBeNull();
  });

  it("returns null when date column is empty", () => {
    const result = mapRow({ title: "T", dueAt: "" });
    expect(result!.dueAt).toBeNull();
  });

  it("returns null when no date column is present", () => {
    const result = mapRow({ title: "T" });
    expect(result!.dueAt).toBeNull();
  });
});

describe("mapRow - combined realistic row", () => {
  it("maps a full realistic row with every known + one unknown column", () => {
    const result = mapRow({
      Title: "Replace bearing",
      Customer: "Acme Co",
      Status: "in_progress",
      "Due Date": "2026-02-01",
      Notes: "High urgency",
      Priority: "P1",
    });

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Replace bearing");
    expect(result!.customer).toBe("Acme Co");
    expect(result!.status).toBe("IN_PROGRESS");
    expect(result!.dueAt).toBeInstanceOf(Date);
    expect(result!.notes).toContain("High urgency");
    expect(result!.notes).toContain("Priority: P1");
  });
});

describe("constants", () => {
  it("exposes MAX_ROWS and MAX_BYTES as positive numbers", () => {
    expect(typeof MAX_ROWS).toBe("number");
    expect(MAX_ROWS).toBeGreaterThan(0);
    expect(typeof MAX_BYTES).toBe("number");
    expect(MAX_BYTES).toBeGreaterThan(0);
  });
});
