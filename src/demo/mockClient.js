// src/demo/mockClient.js
import { getTable, setTable, genId } from "./store";
import { parseSelect, applySelect } from "./select";

const DEMO_USER = { id: "demo-user", email: "demo@rau.be" };
const DEMO_SESSION = { user: DEMO_USER };

// Query-builder: thenable zodat `await supabase.from(...).select()...` werkt.
function makeQuery(table) {
  const state = {
    action: "select",
    selectStr: "*",
    filters: [],          // {col, val}
    orderBy: null,        // {col, ascending}
    single: false,
    payload: null,        // insert/update data
  };

  function rows() {
    let data = getTable(table);
    for (const f of state.filters) data = data.filter((r) => r[f.col] === f.val);
    return data;
  }

  function run() {
    try {
      if (state.action === "insert") {
        const items = (Array.isArray(state.payload) ? state.payload : [state.payload])
          .map((x) => ({ id: genId(), created_at: new Date().toISOString(), ...x }));
        setTable(table, [...getTable(table), ...items]);
        return { data: items, error: null };
      }
      if (state.action === "update") {
        const all = getTable(table);
        const updated = all.map((r) =>
          state.filters.every((f) => r[f.col] === f.val) ? { ...r, ...state.payload } : r
        );
        setTable(table, updated);
        return { data: null, error: null };
      }
      if (state.action === "delete") {
        const all = getTable(table);
        const kept = all.filter((r) => !state.filters.every((f) => r[f.col] === f.val));
        setTable(table, kept);
        return { data: null, error: null };
      }
      // select
      let data = rows();
      if (state.orderBy) {
        const { col, ascending } = state.orderBy;
        data = [...data].sort((a, b) => {
          if (a[col] === b[col]) return 0;
          const lt = a[col] < b[col] ? -1 : 1;
          return ascending ? lt : -lt;
        });
      }
      const parsed = parseSelect(state.selectStr);
      data = data.map((r) => applySelect(r, parsed, table, getTable));
      if (state.single) return { data: data[0] ?? null, error: null };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: { message: String(err) } };
    }
  }

  const builder = {
    select(str = "*") { state.action = state.action === "select" ? "select" : state.action; state.selectStr = str; return builder; },
    insert(payload) { state.action = "insert"; state.payload = payload; return builder; },
    update(payload) { state.action = "update"; state.payload = payload; return builder; },
    delete() { state.action = "delete"; return builder; },
    eq(col, val) { state.filters.push({ col, val }); return builder; },
    order(col, opts = {}) { state.orderBy = { col, ascending: opts.ascending !== false }; return builder; },
    single() { state.single = true; return builder; },
    then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
  };
  return builder;
}

export function createMockClient() {
  return {
    from: (table) => makeQuery(table),
    auth: {
      onAuthStateChange(cb) {
        setTimeout(() => cb("SIGNED_IN", DEMO_SESSION), 0);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signInWithPassword() { return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null }; },
      async signOut() { return { error: null }; },
      async getSession() { return { data: { session: DEMO_SESSION }, error: null }; },
    },
    storage: {
      from() {
        return {
          async upload() { return { data: null, error: { message: "Uploads zijn niet beschikbaar in de demo" } }; },
          getPublicUrl(path) { return { data: { publicUrl: path || "" } }; },
        };
      },
    },
  };
}
