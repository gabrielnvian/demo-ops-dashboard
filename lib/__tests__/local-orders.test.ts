import { beforeEach, describe, expect, it } from "vitest";
import {
  LOCAL_ORDERS_KEY,
  addLocalOrder,
  addLocalOrders,
  addLocalOrdersFromMapped,
  clearLocalOrders,
  getLocalOrders,
  type LocalOrder,
} from "@/lib/local-orders";

function sample(id: string, overrides: Partial<LocalOrder> = {}): LocalOrder {
  return {
    id,
    title: `Order ${id}`,
    customer: "Acme",
    status: "PENDING",
    dueAt: null,
    notes: null,
    createdAt: "2026-04-19T00:00:00.000Z",
    ...overrides,
  };
}

describe("local-orders", () => {
  beforeEach(() => {
    // happy-dom provides localStorage per test environment. Start each
    // test with a clean slate so assertions do not leak.
    window.localStorage.clear();
  });

  it("getLocalOrders returns [] when nothing has been stored", () => {
    expect(getLocalOrders()).toEqual([]);
  });

  it("addLocalOrders then getLocalOrders round-trips the data", () => {
    const a = sample("a");
    const b = sample("b");
    addLocalOrders([a, b]);
    const got = getLocalOrders();
    expect(got).toHaveLength(2);
    expect(got.map((o) => o.id).sort()).toEqual(["a", "b"]);
  });

  it("addLocalOrders dedupes by id, keeping the incoming copy", () => {
    addLocalOrders([sample("a", { title: "first" })]);
    addLocalOrders([
      sample("a", { title: "second" }),
      sample("b", { title: "new" }),
    ]);
    const got = getLocalOrders();
    expect(got).toHaveLength(2);
    const a = got.find((o) => o.id === "a");
    expect(a?.title).toBe("second");
    const b = got.find((o) => o.id === "b");
    expect(b?.title).toBe("new");
  });

  it("addLocalOrder assigns a unique id and createdAt", () => {
    const saved1 = addLocalOrder({
      title: "T1",
      customer: "Acme",
      status: "PENDING",
      dueAt: null,
      notes: null,
    });
    const saved2 = addLocalOrder({
      title: "T2",
      customer: "Acme",
      status: "PENDING",
      dueAt: null,
      notes: null,
    });
    expect(saved1.id).toBeTruthy();
    expect(saved2.id).toBeTruthy();
    expect(saved1.id).not.toBe(saved2.id);
    expect(() => new Date(saved1.createdAt).toISOString()).not.toThrow();
    expect(getLocalOrders()).toHaveLength(2);
  });

  it("clearLocalOrders removes all stored orders", () => {
    addLocalOrders([sample("a"), sample("b")]);
    expect(getLocalOrders()).toHaveLength(2);
    clearLocalOrders();
    expect(getLocalOrders()).toEqual([]);
    expect(window.localStorage.getItem(LOCAL_ORDERS_KEY)).toBeNull();
  });

  it("getLocalOrders returns [] for malformed JSON in storage", () => {
    window.localStorage.setItem(LOCAL_ORDERS_KEY, "not-json{");
    expect(getLocalOrders()).toEqual([]);
  });

  it("getLocalOrders filters out entries that do not match the LocalOrder shape", () => {
    window.localStorage.setItem(
      LOCAL_ORDERS_KEY,
      JSON.stringify([
        sample("ok"),
        { id: 123 },
        "totally not an order",
        null,
      ])
    );
    const got = getLocalOrders();
    expect(got).toHaveLength(1);
    expect(got[0]!.id).toBe("ok");
  });

  it("addLocalOrdersFromMapped assigns ids and persists all entries", () => {
    const saved = addLocalOrdersFromMapped([
      {
        title: "A",
        customer: "Acme",
        status: "PENDING",
        dueAt: null,
        notes: null,
      },
      {
        title: "B",
        customer: "Beta",
        status: "COMPLETED",
        dueAt: "2026-05-01T00:00:00.000Z",
        notes: "hi",
      },
    ]);
    expect(saved).toHaveLength(2);
    expect(new Set(saved.map((o) => o.id)).size).toBe(2);
    expect(getLocalOrders()).toHaveLength(2);
  });

  it("addLocalOrders is a no-op when passed an empty array", () => {
    addLocalOrders([]);
    expect(getLocalOrders()).toEqual([]);
    expect(window.localStorage.getItem(LOCAL_ORDERS_KEY)).toBeNull();
  });
});
