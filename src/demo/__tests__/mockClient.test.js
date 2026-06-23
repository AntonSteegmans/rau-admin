// src/demo/__tests__/mockClient.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";

// localStorage shim voor node
beforeEach(() => {
  const mem = {};
  vi.stubGlobal("localStorage", {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: (k) => { delete mem[k]; },
  });
});

async function freshClient() {
  vi.resetModules();
  const store = await import("../store");
  store.setTable("brands", [{ id: "b1", name: "Porsche" }]);
  store.setTable("models", [{ id: "m1", brand_id: "b1", name: "911 GT3 RS", year: 2023, model_3d_path: null }]);
  store.setTable("clients", [{ id: "c1", name: "Maarten Demo", company: "Privé" }]);
  store.setTable("vehicles", [
    { id: "v1", client_id: "c1", model_id: "m1", plate: "1-AAA-111", status: "garaged", value: 320000, created_at: "2025-01-01" },
  ]);
  store.setTable("services", []);
  const { createMockClient } = await import("../mockClient");
  return createMockClient();
}

describe("mock client", () => {
  it("select with nested embed + eq + order", async () => {
    const supabase = await freshClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, models(name, model_3d_path, year, brands(name))")
      .eq("client_id", "c1")
      .order("created_at");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].plate).toBe("1-AAA-111");
    expect(data[0].models.brands.name).toBe("Porsche");
  });

  it("single() returns one row, not array", async () => {
    const supabase = await freshClient();
    const { data } = await supabase.from("clients").select("*").eq("id", "c1").single();
    expect(data.name).toBe("Maarten Demo");
  });

  it("insert appends a row with generated id", async () => {
    const supabase = await freshClient();
    const { error } = await supabase.from("services").insert({ client_id: "c1", type: "Test" });
    expect(error).toBeNull();
    const { data } = await supabase.from("services").select("*");
    expect(data).toHaveLength(1);
    expect(data[0].id).toBeTruthy();
  });

  it("update with eq mutates matching rows", async () => {
    const supabase = await freshClient();
    await supabase.from("vehicles").update({ status: "in-service" }).eq("id", "v1");
    const { data } = await supabase.from("vehicles").select("*").eq("id", "v1").single();
    expect(data.status).toBe("in-service");
  });

  it("storage upload is disabled but does not throw", async () => {
    const supabase = await freshClient();
    const { error } = await supabase.storage.from("3d-models").upload("x.png", {});
    expect(error).toBeTruthy();
  });

  it("storage remove is a no-op that resolves without error", async () => {
    const supabase = await freshClient();
    const { error } = await supabase.storage.from("3d-models").remove(["x.png"]);
    expect(error).toBeNull();
  });

  it("auth.onAuthStateChange fires a demo session", async () => {
    const supabase = await freshClient();
    const seen = [];
    supabase.auth.onAuthStateChange((_e, session) => seen.push(session));
    await new Promise((r) => setTimeout(r, 0));
    expect(seen[0]?.user?.id).toBeTruthy();
  });
});
