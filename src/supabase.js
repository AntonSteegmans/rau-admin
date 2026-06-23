// DEMO-MODUS: geen echte database. De mock-client leeft op localStorage.
// Terug naar echte Supabase? Herstel de inhoud van supabase.real.js hier.
import { createMockClient } from "./demo/mockClient";

export const supabase = createMockClient();
