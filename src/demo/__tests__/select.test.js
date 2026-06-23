// src/demo/__tests__/select.test.js
import { describe, it, expect } from "vitest";
import { parseSelect, applySelect } from "../select";

describe("parseSelect", () => {
  it("parses a flat wildcard", () => {
    expect(parseSelect("*")).toEqual({ columns: ["*"], embeds: [] });
  });

  it("parses columns plus a nested embed with a deeper embed", () => {
    const r = parseSelect("*, models(name, model_3d_path, year, brands(name))");
    expect(r.columns).toEqual(["*"]);
    expect(r.embeds).toHaveLength(1);
    expect(r.embeds[0].name).toBe("models");
    expect(r.embeds[0].parsed.columns).toEqual(["name", "model_3d_path", "year"]);
    expect(r.embeds[0].parsed.embeds[0].name).toBe("brands");
    expect(r.embeds[0].parsed.embeds[0].parsed.columns).toEqual(["name"]);
  });

  it("parses two sibling embeds", () => {
    const r = parseSelect("*, vehicles(plate, models(name, brands(name)))");
    expect(r.embeds[0].name).toBe("vehicles");
    expect(r.embeds[0].parsed.embeds[0].name).toBe("models");
  });
});

describe("applySelect", () => {
  const tables = {
    brands: [{ id: "b1", name: "Porsche" }],
    models: [{ id: "m1", brand_id: "b1", name: "911 GT3 RS", year: 2023, model_3d_path: null }],
    vehicles: [{ id: "v1", model_id: "m1", client_id: "c1", plate: "1-AAA-111" }],
  };
  const getTable = (t) => tables[t];

  it("embeds a to-one relation with nested embed", () => {
    const parsed = parseSelect("*, models(name, year, brands(name))");
    const row = applySelect(tables.vehicles[0], parsed, "vehicles", getTable);
    expect(row.plate).toBe("1-AAA-111");
    expect(row.models).toEqual({ name: "911 GT3 RS", year: 2023, brands: { name: "Porsche" } });
  });
});
