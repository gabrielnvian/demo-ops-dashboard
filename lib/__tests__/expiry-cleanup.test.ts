import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma singleton before importing the module under test.
// The mock simulates `deleteMany` against a tiny in-memory dataset so we can
// assert both the shape of the query AND that the predicate is applied
// correctly.
vi.mock("@/lib/prisma", () => {
  const rows: Array<{
    id: string;
    expiresAt: Date | null;
  }> = [];

  const deleteMany = vi.fn(
    async (args: {
      where?: { expiresAt?: { not?: null; lt?: Date } };
    }) => {
      const lt = args?.where?.expiresAt?.lt;
      const requireNonNull = args?.where?.expiresAt?.not === null;
      if (!lt) {
        return { count: 0 };
      }
      const before = rows.length;
      // remove matching rows in place
      for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i];
        const isNonNull = r.expiresAt !== null;
        const isPast = r.expiresAt !== null && r.expiresAt < lt;
        if ((!requireNonNull || isNonNull) && isPast) {
          rows.splice(i, 1);
        }
      }
      return { count: before - rows.length };
    }
  );

  return {
    prisma: {
      jobOrder: { deleteMany },
      __rows: rows,
      __deleteMany: deleteMany,
    },
  };
});

// Import AFTER the mock so the module picks up the mocked prisma.
import { sweepExpired } from "@/lib/expiry-cleanup";
import { prisma } from "@/lib/prisma";

// These handles are set on the mock object above.
const mockRows = (prisma as unknown as { __rows: Array<{ id: string; expiresAt: Date | null }> })
  .__rows;
const mockDeleteMany = (prisma as unknown as { __deleteMany: ReturnType<typeof vi.fn> })
  .__deleteMany;

beforeEach(() => {
  mockRows.length = 0;
  mockDeleteMany.mockClear();
});

describe("sweepExpired", () => {
  it("deletes rows whose expiresAt is non-null and strictly in the past", async () => {
    const past = new Date(Date.now() - 60_000);
    mockRows.push({ id: "expired-1", expiresAt: past });
    mockRows.push({ id: "expired-2", expiresAt: past });

    const deleted = await sweepExpired();

    expect(deleted).toBe(2);
    expect(mockRows.length).toBe(0);
    expect(mockDeleteMany).toHaveBeenCalledTimes(1);
    const arg = mockDeleteMany.mock.calls[0][0];
    expect(arg.where.expiresAt.not).toBeNull();
    expect(arg.where.expiresAt.lt).toBeInstanceOf(Date);
  });

  it("never deletes rows where expiresAt is null", async () => {
    mockRows.push({ id: "keep-null-1", expiresAt: null });
    mockRows.push({ id: "keep-null-2", expiresAt: null });

    const deleted = await sweepExpired();

    expect(deleted).toBe(0);
    expect(mockRows.length).toBe(2);
  });

  it("never deletes rows where expiresAt is in the future", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    mockRows.push({ id: "future-1", expiresAt: future });

    const deleted = await sweepExpired();

    expect(deleted).toBe(0);
    expect(mockRows.length).toBe(1);
  });

  it("only deletes the past-dated rows in a mixed dataset", async () => {
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 60 * 60 * 1000);
    mockRows.push({ id: "past", expiresAt: past });
    mockRows.push({ id: "future", expiresAt: future });
    mockRows.push({ id: "null", expiresAt: null });

    const deleted = await sweepExpired();

    expect(deleted).toBe(1);
    expect(mockRows.map((r) => r.id).sort()).toEqual(["future", "null"]);
  });

  it("swallows errors and returns 0 if deleteMany throws", async () => {
    mockDeleteMany.mockImplementationOnce(async () => {
      throw new Error("db unreachable");
    });

    const deleted = await sweepExpired();

    expect(deleted).toBe(0);
  });
});
