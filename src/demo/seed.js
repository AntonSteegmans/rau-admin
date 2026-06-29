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
    { id: "m-chiron",  brand_id: "b-bug", name: "Chiron Super Sport",            year: 2022, model_3d_path: "/models/v-chiron.glb" },
    { id: "m-conti",   brand_id: "b-ben", name: "Continental GT Speed",          year: 2023, model_3d_path: null },
    { id: "m-panamera",brand_id: "b-por", name: "Panamera Turbo S E-Hybrid",     year: 2024, model_3d_path: null },
    { id: "m-bentayga",brand_id: "b-ben", name: "Bentayga EWB Azure",            year: 2023, model_3d_path: null },
    { id: "m-glc63",   brand_id: "b-amg", name: "GLC 63 S E Performance",        year: 2024, model_3d_path: null },
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
    // ── c-maarten (Collection) — 6 vehicles ──────────────────────────────
    // Bugatti Chiron Super Sport — appreciates (hypercar collectible)
    veh("v-chiron", "c-maarten", "m-chiron", "1-BUG-001", "Bleu Royal Carbon", "1.240 km", "2026-09-01",
        3650000, 3950000, "garaged", [
          { d: "2025-04", v: 3655000 }, { d: "2025-05", v: 3668000 }, { d: "2025-06", v: 3680000 },
          { d: "2025-07", v: 3695000 }, { d: "2025-08", v: 3710000 }, { d: "2025-09", v: 3728000 },
          { d: "2025-10", v: 3748000 }, { d: "2025-11", v: 3770000 }, { d: "2025-12", v: 3800000 },
          { d: "2026-01", v: 3828000 }, { d: "2026-02", v: 3858000 }, { d: "2026-03", v: 3886000 },
          { d: "2026-04", v: 3910000 }, { d: "2026-05", v: 3932000 }, { d: "2026-06", v: 3950000 },
        ], 99, "3d"),
    // Porsche 992 GT3 RS Manthey — appreciates (limited motorsport special)
    veh("v-gt3rs", "c-maarten", "m-gt3rs", "1-RS-911", "Arctic Grey", "3.480 km", "2026-07-15",
        290000, 335000, "garaged", [
          { d: "2025-04", v: 291000 }, { d: "2025-05", v: 294000 }, { d: "2025-06", v: 298000 },
          { d: "2025-07", v: 302000 }, { d: "2025-08", v: 306000 }, { d: "2025-09", v: 310000 },
          { d: "2025-10", v: 314000 }, { d: "2025-11", v: 318000 }, { d: "2025-12", v: 322000 },
          { d: "2026-01", v: 325000 }, { d: "2026-02", v: 328000 }, { d: "2026-03", v: 330000 },
          { d: "2026-04", v: 332000 }, { d: "2026-05", v: 333500 }, { d: "2026-06", v: 335000 },
        ], 98),
    // Bentley Continental GT Speed — gently depreciates
    veh("v-conti", "c-maarten", "m-conti", "1-BEN-007", "Beluga Black", "9.120 km", "2026-08-10",
        298000, 282000, "garaged", [
          { d: "2025-04", v: 297000 }, { d: "2025-05", v: 295500 }, { d: "2025-06", v: 294000 },
          { d: "2025-07", v: 292500 }, { d: "2025-08", v: 291000 }, { d: "2025-09", v: 290000 },
          { d: "2025-10", v: 289000 }, { d: "2025-11", v: 287500 }, { d: "2025-12", v: 286000 },
          { d: "2026-01", v: 285000 }, { d: "2026-02", v: 284000 }, { d: "2026-03", v: 283500 },
          { d: "2026-04", v: 283000 }, { d: "2026-05", v: 282500 }, { d: "2026-06", v: 282000 },
        ], 95),
    // Defender OCTA V8 — roughly flat-to-up (strong demand)
    veh("v-octa", "c-maarten", "m-defocta", "1-OCT-008", "Carpathian Grey", "5.600 km", "2026-07-28",
        185000, 190000, "in-service", [
          { d: "2025-04", v: 185500 }, { d: "2025-05", v: 185800 }, { d: "2025-06", v: 186200 },
          { d: "2025-07", v: 186500 }, { d: "2025-08", v: 187000 }, { d: "2025-09", v: 187400 },
          { d: "2025-10", v: 187800 }, { d: "2025-11", v: 188200 }, { d: "2025-12", v: 188500 },
          { d: "2026-01", v: 188800 }, { d: "2026-02", v: 189000 }, { d: "2026-03", v: 189200 },
          { d: "2026-04", v: 189500 }, { d: "2026-05", v: 189800 }, { d: "2026-06", v: 190000 },
        ], 96),
    // Mercedes-AMG GT Roadster — depreciates moderately
    veh("v-amggt", "c-maarten", "m-amggt", "1-AMG-009", "Magno Grey", "7.300 km", "2026-10-05",
        178000, 172000, "garaged", [
          { d: "2025-04", v: 177500 }, { d: "2025-05", v: 177000 }, { d: "2025-06", v: 176500 },
          { d: "2025-07", v: 176000 }, { d: "2025-08", v: 175500 }, { d: "2025-09", v: 175000 },
          { d: "2025-10", v: 174500 }, { d: "2025-11", v: 174000 }, { d: "2025-12", v: 173500 },
          { d: "2026-01", v: 173200 }, { d: "2026-02", v: 173000 }, { d: "2026-03", v: 172700 },
          { d: "2026-04", v: 172500 }, { d: "2026-05", v: 172200 }, { d: "2026-06", v: 172000 },
        ], 94),
    // Range Rover Autobiography LWB — depreciates gently
    veh("v-rr", "c-maarten", "m-rr", "1-RR-010", "Santorini Black", "11.450 km", "2026-09-20",
        162000, 154000, "pickup-scheduled", [
          { d: "2025-04", v: 161500 }, { d: "2025-05", v: 160800 }, { d: "2025-06", v: 160000 },
          { d: "2025-07", v: 159200 }, { d: "2025-08", v: 158500 }, { d: "2025-09", v: 157800 },
          { d: "2025-10", v: 157200 }, { d: "2025-11", v: 156600 }, { d: "2025-12", v: 156000 },
          { d: "2026-01", v: 155500 }, { d: "2026-02", v: 155000 }, { d: "2026-03", v: 154600 },
          { d: "2026-04", v: 154400 }, { d: "2026-05", v: 154200 }, { d: "2026-06", v: 154000 },
        ], 93),

    // ── c-vdb: Alexander Van den Berg (Signature) — 2 vehicles ───────────
    // Porsche Panamera Turbo S — gently depreciates
    veh("v-vdb1", "c-vdb", "m-panamera", "1-VDB-01", "Jet Black Metallic", "8.640 km", "2026-08-12",
        198000, 188000, "garaged", [
          { d: "2025-07", v: 197000 }, { d: "2025-08", v: 196200 },
          { d: "2025-09", v: 195400 }, { d: "2025-10", v: 194500 },
          { d: "2025-11", v: 193500 }, { d: "2025-12", v: 192500 },
          { d: "2026-01", v: 191500 }, { d: "2026-02", v: 190800 },
          { d: "2026-03", v: 190000 }, { d: "2026-04", v: 189400 },
          { d: "2026-05", v: 188700 }, { d: "2026-06", v: 188000 },
        ], 96),
    // Bentley Bentayga EWB — stable prestige value
    veh("v-vdb2", "c-vdb", "m-bentayga", "1-VDB-02", "Verdant", "3.210 km", "2026-11-01",
        295000, 290000, "garaged", [
          { d: "2025-07", v: 294500 }, { d: "2025-08", v: 294000 },
          { d: "2025-09", v: 293500 }, { d: "2025-10", v: 293000 },
          { d: "2025-11", v: 292500 }, { d: "2025-12", v: 292000 },
          { d: "2026-01", v: 291500 }, { d: "2026-02", v: 291200 },
          { d: "2026-03", v: 290800 }, { d: "2026-04", v: 290600 },
          { d: "2026-05", v: 290300 }, { d: "2026-06", v: 290000 },
        ], 97),

    // ── c-dub: Marie-Claire Dubois (Essential) — 1 vehicle ───────────────
    // Mercedes-AMG GLC 63 — moderate depreciation
    veh("v-dub1", "c-dub", "m-glc63", "1-DUB-01", "Obsidian Black", "12.800 km", "2026-07-20",
        145000, 134000, "in-service", [
          { d: "2025-09", v: 144000 }, { d: "2025-10", v: 143000 },
          { d: "2025-11", v: 142000 }, { d: "2025-12", v: 141000 },
          { d: "2026-01", v: 140000 }, { d: "2026-02", v: 138500 },
          { d: "2026-03", v: 137200 }, { d: "2026-04", v: 136000 },
          { d: "2026-05", v: 135000 }, { d: "2026-06", v: 134000 },
        ], 91),
  ],
  services: [
    // ── Maarten ──
    { id: "s1", vehicle_id: "v-octa", client_id: "c-maarten", type: "Bandenwissel",
      description: "Wissel naar zomerset — Michelin Pilot Sport", status: "in-progress",
      date: "2026-06-25", technician: "Kevin Martens", priority: "high", estimated_cost: 3200, created_at: "2026-06-20" },
    { id: "s2", vehicle_id: "v-rr", client_id: "c-maarten", type: "Ophaling & transport",
      description: "Ophaling bij klant, volledige detailing, ceramic touch-up", status: "scheduled",
      date: "2026-06-28", technician: "Yannick De Wolf", priority: "normal", estimated_cost: 1450, created_at: "2026-06-19" },
    { id: "s3", vehicle_id: "v-chiron", client_id: "c-maarten", type: "Jaarlijkse keuring",
      description: "Bugatti certified inspectie — meerdaags proces", status: "scheduled",
      date: "2026-09-01", technician: "Kevin Martens", priority: "high", estimated_cost: 12500, created_at: "2026-06-15" },
    { id: "s4", vehicle_id: "v-gt3rs", client_id: "c-maarten", type: "Stallingsvoorbereiding",
      description: "Battery tender, bandenspanning, hoes geplaatst", status: "completed",
      date: "2026-06-10", technician: "Yannick De Wolf", priority: "low", estimated_cost: 350, created_at: "2026-06-08" },
    // ── c-vdb ──
    { id: "s5", vehicle_id: "v-vdb1", client_id: "c-vdb", type: "Detailing",
      description: "Volledig handwas, polishing & ceramic coating refresh", status: "completed",
      date: "2026-06-05", technician: "Yannick De Wolf", priority: "normal", estimated_cost: 980, created_at: "2026-06-02" },
    { id: "s6", vehicle_id: "v-vdb2", client_id: "c-vdb", type: "Jaarlijkse keuring",
      description: "Bentley-gecertificeerde inspectie & 12-maands beurt", status: "scheduled",
      date: "2026-07-15", technician: "Kevin Martens", priority: "high", estimated_cost: 4200, created_at: "2026-06-22" },
    { id: "s7", vehicle_id: "v-vdb1", client_id: "c-vdb", type: "Stallingsvoorbereiding",
      description: "Winterstalling: coverplaatsing, bandenchecks, accubeveiliging", status: "completed",
      date: "2026-04-18", technician: "Jonas Vermeersch", priority: "low", estimated_cost: 420, created_at: "2026-04-14" },
    // ── c-dub ──
    { id: "s8", vehicle_id: "v-dub1", client_id: "c-dub", type: "Bandenwissel",
      description: "Omschakeling zomerbanden — Michelin Pilot Sport 5", status: "in-progress",
      date: "2026-06-23", technician: "Jonas Vermeersch", priority: "normal", estimated_cost: 1800, created_at: "2026-06-18" },
    { id: "s9", vehicle_id: "v-dub1", client_id: "c-dub", type: "Detailing",
      description: "Volledige exterieur detailing na wintersaison", status: "completed",
      date: "2026-05-14", technician: "Yannick De Wolf", priority: "low", estimated_cost: 750, created_at: "2026-05-10" },
  ],
  invoices: [
    // ── Maarten ──
    { id: "i1",  client_id: "c-maarten", amount: 2950, type: "Abonnement", description: null, period: "Juni 2026",  status: "paid",    date: "2026-06-01", created_at: "2026-06-01" },
    { id: "i2",  client_id: "c-maarten", amount: 3200, type: "Service",    description: "Defender OCTA — Bandenwissel", period: null, status: "pending",  date: "2026-06-25", created_at: "2026-06-25" },
    { id: "i3",  client_id: "c-maarten", amount: 2950, type: "Abonnement", description: null, period: "Mei 2026",   status: "paid",    date: "2026-05-01", created_at: "2026-05-01" },
    // ── c-vdb ──
    { id: "i4",  client_id: "c-vdb",     amount: 1500, type: "Abonnement", description: null, period: "Juni 2026",  status: "paid",    date: "2026-06-01", created_at: "2026-06-01" },
    { id: "i5",  client_id: "c-vdb",     amount: 980,  type: "Service",    description: "Panamera — Detailing", period: null,      status: "paid",    date: "2026-06-05", created_at: "2026-06-05" },
    { id: "i6",  client_id: "c-vdb",     amount: 4200, type: "Service",    description: "Bentayga — Jaarlijkse keuring", period: null, status: "pending", date: "2026-07-15", created_at: "2026-06-22" },
    { id: "i7",  client_id: "c-vdb",     amount: 1500, type: "Abonnement", description: null, period: "Mei 2026",   status: "paid",    date: "2026-05-01", created_at: "2026-05-01" },
    // ── c-dub ──
    { id: "i8",  client_id: "c-dub",     amount: 750,  type: "Abonnement", description: null, period: "Juni 2026",  status: "overdue", date: "2026-06-01", created_at: "2026-06-01" },
    { id: "i9",  client_id: "c-dub",     amount: 750,  type: "Service",    description: "GLC 63 — Detailing", period: null,      status: "paid",    date: "2026-05-14", created_at: "2026-05-14" },
    { id: "i10", client_id: "c-dub",     amount: 750,  type: "Abonnement", description: null, period: "Mei 2026",   status: "paid",    date: "2026-05-01", created_at: "2026-05-01" },
  ],
  messages: [
    { id: "msg1", client_id: "c-maarten", subject: "Welkom bij RAÚ", body: "Maarten, uw collectie is volledig opgenomen in uw portaal. Bekijk gerust de waarde-evolutie.", direction: "outgoing", read: false, created_at: "2026-06-20T09:00:00Z" },
    { id: "msg2", client_id: "c-maarten", subject: "Chiron — keuring gepland", body: "De jaarlijkse Bugatti-keuring staat gepland op 1 september. Wij coördineren alles.", direction: "outgoing", read: false, created_at: "2026-06-21T14:00:00Z" },
    { id: "msg3", client_id: "c-vdb", subject: "Bentayga — keuring ingepland", body: "De jaarlijkse Bentley-inspectie is vastgelegd op 15 juli. Wij nemen contact op voor afhaling.", direction: "outgoing", read: true, created_at: "2026-06-22T10:00:00Z" },
    { id: "msg4", client_id: "c-dub", subject: "Factuur openstaand", body: "Uw abonnementsfactuur van juni staat nog open. Gelieve dit zo spoedig mogelijk te regelen.", direction: "outgoing", read: true, created_at: "2026-06-18T11:00:00Z" },
  ],
  team: [
    { id: "t1", name: "Kevin Martens",    role: "Hoofdtechnicus",       speciality: "Motor & aandrijflijn",       avatar: "KM", status: "busy",      active_tasks: 2 },
    { id: "t2", name: "Yannick De Wolf",  role: "Detailing-specialist",  speciality: "Paint correction & ceramic", avatar: "YD", status: "busy",      active_tasks: 1 },
    { id: "t3", name: "Jonas Vermeersch", role: "Technicus",             speciality: "Diagnose & elektronica",     avatar: "JV", status: "available", active_tasks: 0 },
    { id: "t4", name: "Lisa Claes",       role: "Klantenrelaties",       speciality: "Planning & communicatie",    avatar: "LC", status: "busy",      active_tasks: 3 },
  ],
  // Revenue history — 12 months 2025-07 → 2026-06
  // recurring = MRR that month (grows as clients are onboarded)
  // service   = service revenue that month (fluctuates)
  revenueHistory: [
    { month: "2025-07", recurring: 2950, service: 1200 },
    { month: "2025-08", recurring: 2950, service: 3400 },
    { month: "2025-09", recurring: 2950, service: 980  },
    { month: "2025-10", recurring: 2950, service: 2100 },
    { month: "2025-11", recurring: 2950, service: 4800 },
    { month: "2025-12", recurring: 2950, service: 1650 },
    { month: "2026-01", recurring: 2950, service: 2800 },
    { month: "2026-02", recurring: 2950, service: 1400 },
    { month: "2026-03", recurring: 4450, service: 5200 },  // c-vdb onboarded 2026-03-15
    { month: "2026-04", recurring: 5200, service: 2750 },  // c-dub onboarded 2026-04-10
    { month: "2026-05", recurring: 5200, service: 3980 },
    { month: "2026-06", recurring: 5200, service: 8180 },  // chiron keuring gepland, bandenwissel
  ],
};

// Helper voor vehicles incl. nieuwe asset-velden.
function veh(id, client_id, model_id, plate, color, mileage, next_service, purchase_value, current_value, status, value_history, condition_score, display_mode = "image") {
  return {
    id, client_id, model_id, plate, color, mileage, next_service,
    value: current_value, purchase_value, current_value, value_history, condition_score,
    status, display_mode, image_path: `/cars/${id}.jpg`,
    documents: [
      { type: "Verzekeringspolis", status: "Actief", date: "2026-01-01" },
      { type: "Technische keuring", status: "Geldig", date: "2026-03-01" },
      { type: "Aankoopfactuur", status: "Gearchiveerd", date: "—" },
    ],
    created_at: "2026-06-01",
  };
}
