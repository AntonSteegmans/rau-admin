// src/demo/store.js
import { seedData } from "./seed";

const STORAGE_KEY = "rau-demo-db";

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupte data -> reseed */ }
  const fresh = clone(seedData);
  persist(fresh);
  return fresh;
}

function persist(db) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* quota */ }
}

let db = load();

export function getTable(name) { return db[name] ?? []; }
export function setTable(name, rows) { db[name] = rows; persist(db); }
export function resetDemo() { db = clone(seedData); persist(db); }
export function genId() { return "id-" + Math.random().toString(36).slice(2, 10); }
