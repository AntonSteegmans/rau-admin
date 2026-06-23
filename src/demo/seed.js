// src/demo/seed.js — RAÚ demodata, gepersonaliseerd voor Maarten
export const seedData = {
  brands: [
    { id: "b-por", name: "Porsche" },
    { id: "b-amg", name: "Mercedes-AMG" },
    { id: "b-lr",  name: "Land Rover" },
    { id: "b-rr",  name: "Range Rover" },
    { id: "b-bug", name: "Bugatti" },
    { id: "b-ben", name: "Bentley" },
  ],
  models: [
    { id: "m-gt3rs",   brand_id: "b-por", name: "992 911 GT3 RS — Manthey Kit", year: 2023, model_3d_path: null },
    { id: "m-amggt",   brand_id: "b-amg", name: "AMG GT Roadster",               year: 2024, model_3d_path: null },
    { id: "m-rr",      brand_id: "b-rr",  name: "Autobiography LWB",             year: 2024, model_3d_path: null },
    { id: "m-defocta", brand_id: "b-lr",  name: "Defender OCTA V8",              year: 2024, model_3d_path: null },
    { id: "m-chiron",  brand_id: "b-bug", name: "Chiron Super Sport",            year: 2022, model_3d_path: null },
    { id: "m-conti",   brand_id: "b-ben", name: "Continental GT Speed",          year: 2023, model_3d_path: null },
  ],
  clients: [
    { id: "c-maarten", name: "Maarten", email: "maarten@prive.be", phone: "+32 470 00 00 00",
      company: "Privécollectie", tier: "Collection", since: "2026-06-01", monthly_fee: 2950,
      status: "active", avatar: "M", total_spent: 0 },
    { id: "c-vdb", name: "Alexander Van den Berg", email: "alexander@vdb-holding.be", phone: "+32 475 12 34 56",
      company: "VDB Holding", tier: "Signature", since: "2026-03-15", monthly_fee: 1500, status: "active", avatar: "AV", total_spent: 12400 },
    { id: "c-dub", name: "Marie-Claire Dubois", email: "mc@dubois-invest.be", phone: "+32 476 98 76 54",
      company: "Dubois Investments", tier: "Essential", since: "2026-04-10", monthly_fee: 750, status: "active", avatar: "MD", total_spent: 3600 },
  ],
  profiles: [
    { id: "demo-user", role: "admin", client_id: null },
  ],
  vehicles: [
    veh("v-chiron", "c-maarten", "m-chiron", "1-BUG-001", "Bleu Royal Carbon", "1.240 km", "2026-09-01",
        3650000, 3950000, "garaged", [{ d: "2022-01", v: 3650000 }, { d: "2024-01", v: 3800000 }, { d: "2026-06", v: 3950000 }], 99),
    veh("v-gt3rs", "c-maarten", "m-gt3rs", "1-RS-911", "Arctic Grey", "3.480 km", "2026-07-15",
        290000, 335000, "garaged", [{ d: "2023-06", v: 290000 }, { d: "2024-06", v: 312000 }, { d: "2026-06", v: 335000 }], 98),
    veh("v-conti", "c-maarten", "m-conti", "1-BEN-007", "Beluga Black", "9.120 km", "2026-08-10",
        298000, 282000, "garaged", [{ d: "2023-03", v: 298000 }, { d: "2026-06", v: 282000 }], 95),
    veh("v-octa", "c-maarten", "m-defocta", "1-OCT-008", "Carpathian Grey", "5.600 km", "2026-07-28",
        185000, 190000, "in-service", [{ d: "2024-02", v: 185000 }, { d: "2026-06", v: 190000 }], 96),
    veh("v-amggt", "c-maarten", "m-amggt", "1-AMG-009", "Magno Grey", "7.300 km", "2026-10-05",
        178000, 172000, "garaged", [{ d: "2024-04", v: 178000 }, { d: "2026-06", v: 172000 }], 94),
    veh("v-rr", "c-maarten", "m-rr", "1-RR-010", "Santorini Black", "11.450 km", "2026-09-20",
        162000, 154000, "pickup-scheduled", [{ d: "2024-01", v: 162000 }, { d: "2026-06", v: 154000 }], 93),
  ],
  services: [
    { id: "s1", vehicle_id: "v-octa", client_id: "c-maarten", type: "Bandenwissel",
      description: "Wissel naar zomerset — Michelin Pilot Sport", status: "in-progress",
      date: "2026-06-25", technician: "Kevin Martens", priority: "high", estimated_cost: 3200, created_at: "2026-06-20" },
    { id: "s2", vehicle_id: "v-rr", client_id: "c-maarten", type: "Ophaling & detailing",
      description: "Ophaling bij klant, volledige detailing, ceramic touch-up", status: "scheduled",
      date: "2026-06-28", technician: "Yannick De Wolf", priority: "normal", estimated_cost: 1450, created_at: "2026-06-19" },
    { id: "s3", vehicle_id: "v-chiron", client_id: "c-maarten", type: "Jaarlijkse keuring",
      description: "Bugatti certified inspectie — meerdaags proces", status: "scheduled",
      date: "2026-09-01", technician: "Kevin Martens", priority: "high", estimated_cost: 12500, created_at: "2026-06-15" },
    { id: "s4", vehicle_id: "v-gt3rs", client_id: "c-maarten", type: "Stallingsvoorbereiding",
      description: "Battery tender, bandenspanning, hoes geplaatst", status: "completed",
      date: "2026-06-10", technician: "Yannick De Wolf", priority: "low", estimated_cost: 350, created_at: "2026-06-08" },
  ],
  invoices: [
    { id: "i1", client_id: "c-maarten", amount: 2950, type: "Abonnement", description: null, period: "Juni 2026", status: "paid", date: "2026-06-01", created_at: "2026-06-01" },
    { id: "i2", client_id: "c-maarten", amount: 3200, type: "Service", description: "Defender OCTA — Bandenwissel", period: null, status: "pending", date: "2026-06-25", created_at: "2026-06-25" },
  ],
  messages: [
    { id: "msg1", client_id: "c-maarten", subject: "Welkom bij RAÚ", body: "Maarten, uw collectie is volledig opgenomen in uw portaal. Bekijk gerust de waarde-evolutie.", direction: "outgoing", read: false, created_at: "2026-06-20T09:00:00Z" },
    { id: "msg2", client_id: "c-maarten", subject: "Chiron — keuring gepland", body: "De jaarlijkse Bugatti-keuring staat gepland op 1 september. Wij coördineren alles.", direction: "outgoing", read: false, created_at: "2026-06-21T14:00:00Z" },
  ],
  team: [
    { id: "t1", name: "Kevin Martens", role: "Hoofdtechnicus", speciality: "Motor & aandrijflijn", avatar: "KM", status: "busy", active_tasks: 2 },
    { id: "t2", name: "Yannick De Wolf", role: "Detailing-specialist", speciality: "Paint correction & ceramic", avatar: "YD", status: "busy", active_tasks: 1 },
    { id: "t3", name: "Jonas Vermeersch", role: "Technicus", speciality: "Diagnose & elektronica", avatar: "JV", status: "available", active_tasks: 0 },
    { id: "t4", name: "Lisa Claes", role: "Klantenrelaties", speciality: "Planning & communicatie", avatar: "LC", status: "busy", active_tasks: 3 },
  ],
};

// Helper voor vehicles incl. nieuwe asset-velden.
function veh(id, client_id, model_id, plate, color, mileage, next_service, purchase_value, current_value, status, value_history, condition_score) {
  return {
    id, client_id, model_id, plate, color, mileage, next_service,
    value: current_value, purchase_value, current_value, value_history, condition_score,
    status, display_mode: "image", image_path: "",
    documents: [
      { type: "Verzekeringspolis", status: "Actief", date: "2026-01-01" },
      { type: "Technische keuring", status: "Geldig", date: "2026-03-01" },
      { type: "Aankoopfactuur", status: "Gearchiveerd", date: "—" },
    ],
    created_at: "2026-06-01",
  };
}
