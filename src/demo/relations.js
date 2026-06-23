// src/demo/relations.js
// Beschrijft to-one foreign keys per tabel zodat de mock geneste
// select()-strings kan resolven (zoals Supabase PostgREST embedding).
export const RELATIONS = {
  vehicles: {
    models:  { table: "models",  localKey: "model_id" },
    clients: { table: "clients", localKey: "client_id" },
  },
  models: {
    brands: { table: "brands", localKey: "brand_id" },
  },
  services: {
    vehicles: { table: "vehicles", localKey: "vehicle_id" },
  },
};
