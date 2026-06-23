// src/demo/select.js
import { RELATIONS } from "./relations";

// Split op komma's op het hoogste niveau (haakjes negeren).
function splitTopLevel(str) {
  const parts = [];
  let depth = 0, cur = "";
  for (const ch of str) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

// "models(name, brands(name))" -> { name:"models", inner:"name, brands(name)" }
function parseEmbed(token) {
  const open = token.indexOf("(");
  const name = token.slice(0, open).trim();
  const inner = token.slice(open + 1, token.lastIndexOf(")"));
  return { name, inner };
}

export function parseSelect(str) {
  const columns = [];
  const embeds = [];
  for (const token of splitTopLevel(str)) {
    if (token.includes("(")) {
      const { name, inner } = parseEmbed(token);
      embeds.push({ name, parsed: parseSelect(inner) });
    } else {
      columns.push(token);
    }
  }
  return { columns, embeds };
}

// Past een geparste select toe op één rij.
export function applySelect(row, parsed, table, getTable) {
  if (!row) return row;
  let out;
  if (parsed.columns.includes("*") || parsed.columns.length === 0) {
    out = { ...row };
  } else {
    out = {};
    for (const c of parsed.columns) out[c] = row[c];
  }
  for (const embed of parsed.embeds) {
    const rel = RELATIONS[table]?.[embed.name];
    if (!rel) { out[embed.name] = null; continue; }
    const related = getTable(rel.table).find((r) => r.id === row[rel.localKey]);
    out[embed.name] = related ? applySelect(related, embed.parsed, rel.table, getTable) : null;
  }
  return out;
}
