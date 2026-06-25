// src/demo/valuation.js — deterministische offline AI-waardeschatting
// Pure functie, geen imports nodig, stabiel (geen Math.random / Date.now).

/**
 * Berekent een gesimuleerde marktwaarde op basis van de velden van een voertuig.
 * @param {object} vehicle — rijke vehicle uit seedData (incl. models+brands join)
 * @returns {{ estimatedValue, confidence, trendPct, factors, narrative, source }}
 */
export function estimateValuation(vehicle) {
  const base = vehicle.current_value ?? vehicle.value ?? 0;
  const purchaseValue = vehicle.purchase_value ?? base;
  const conditionScore = vehicle.condition_score ?? 80;
  const valueHistory = Array.isArray(vehicle.value_history) ? vehicle.value_history : [];
  const brandName = vehicle.models?.brands?.name ?? "";
  const modelName = vehicle.models?.name ?? "";

  // ── 1. Kilometerstand parsen (deterministisch) ──────────────────────────────
  const kmStr = vehicle.mileage ?? "";
  const kmDigits = kmStr.replace(/\D/g, "");
  const km = kmDigits ? parseInt(kmDigits, 10) : 5000;

  // ── 2. Nudge op basis van conditie en km ────────────────────────────────────
  // Elk punt boven 90 of elk erg laag km-getal = licht positief.
  // Alles binnen ±3% van current_value om realistisch te blijven.
  const conditionNudge = ((conditionScore - 88) / 100) * 0.012; // max +/- ~1.2%
  const kmNudge = km < 3000 ? 0.018 : km < 8000 ? 0.006 : km < 15000 ? 0 : -0.009;
  const totalNudge = conditionNudge + kmNudge;
  // Begrenzen tot ±3%
  const clampedNudge = Math.max(-0.03, Math.min(0.03, totalNudge));
  const estimatedValue = Math.round(base * (1 + clampedNudge));

  // ── 3. Trend t.o.v. aankoopwaarde ───────────────────────────────────────────
  const trendPct = purchaseValue
    ? Math.round(((estimatedValue - purchaseValue) / purchaseValue) * 1000) / 10
    : 0;

  // ── 4. Betrouwbaarheid ───────────────────────────────────────────────────────
  const historyBonus = valueHistory.length >= 3 ? 8 : valueHistory.length >= 2 ? 4 : 0;
  const condBonus = Math.round(conditionScore / 20);
  const confidence = Math.min(97, 80 + historyBonus + condBonus);

  // ── 5. Factoren ──────────────────────────────────────────────────────────────
  const factors = [];

  // a) Kilometerstand
  if (km < 3000) {
    factors.push({ label: "Kilometerstand", impact: "positief", detail: `${kmStr} — uitzonderlijk laag, verhoogt de marktwaarde.` });
  } else if (km < 8000) {
    factors.push({ label: "Kilometerstand", impact: "positief", detail: `${kmStr} — laag kilometrage voor dit segment.` });
  } else if (km < 18000) {
    factors.push({ label: "Kilometerstand", impact: "neutraal", detail: `${kmStr} — conform verwachting voor dit voertuigtype.` });
  } else {
    factors.push({ label: "Kilometerstand", impact: "negatief", detail: `${kmStr} — lichte druk op de herverkoopwaarde.` });
  }

  // b) Conditie
  if (conditionScore >= 97) {
    factors.push({ label: "Conditie", impact: "positief", detail: `Conditiescore ${conditionScore}/100 — showroomtoestand.` });
  } else if (conditionScore >= 92) {
    factors.push({ label: "Conditie", impact: "positief", detail: `Conditiescore ${conditionScore}/100 — uitstekend onderhouden.` });
  } else if (conditionScore >= 85) {
    factors.push({ label: "Conditie", impact: "neutraal", detail: `Conditiescore ${conditionScore}/100 — goede staat, geen bijzonderheden.` });
  } else {
    factors.push({ label: "Conditie", impact: "negatief", detail: `Conditiescore ${conditionScore}/100 — zichtbare slijtage aanwezig.` });
  }

  // c) Zeldzaamheid / merk
  const premiumBrands = ["bugatti", "koenigsegg", "pagani", "lamborghini"];
  const sportsBrands  = ["porsche", "ferrari", "mclaren", "aston martin", "bentley"];
  const bn = brandName.toLowerCase();
  const mn = modelName.toLowerCase();
  const isUltraRare = premiumBrands.some(b => bn.includes(b));
  const isSports    = sportsBrands.some(b => bn.includes(b)) || mn.includes("gt3") || mn.includes("super sport");

  if (isUltraRare) {
    factors.push({ label: "Zeldzaamheid", impact: "positief", detail: `${brandName} heeft een beperkte productie — sterke vraag bij verzamelaars wereldwijd.` });
  } else if (isSports) {
    factors.push({ label: "Zeldzaamheid", impact: "positief", detail: `${brandName} ${modelName} geniet sterke vraag in het Europese verzamelaarssegment.` });
  } else {
    factors.push({ label: "Zeldzaamheid", impact: "neutraal", detail: `${brandName} — solide marktpositie, voldoende aanbod voor dit type.` });
  }

  // d) Markttrend (op basis van value_history delta)
  let trendImpact = "neutraal";
  let trendDetail = "Onvoldoende historische data om een trend te bepalen.";
  if (valueHistory.length >= 2) {
    const last   = valueHistory[valueHistory.length - 1].v;
    const prev   = valueHistory[valueHistory.length - 2].v;
    const deltaPct = ((last - prev) / prev) * 100;
    if (deltaPct > 1.5) {
      trendImpact = "positief";
      trendDetail = `Waarde steeg met ${deltaPct.toFixed(1)}% in de laatste periode — stijgende marktinteresse.`;
    } else if (deltaPct < -1.5) {
      trendImpact = "negatief";
      trendDetail = `Waarde daalde met ${Math.abs(deltaPct).toFixed(1)}% in de laatste periode — matige marktdruk.`;
    } else {
      trendImpact = "neutraal";
      trendDetail = `Stabiele waarde-evolutie (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%) in de laatste meetperiode.`;
    }
  }
  factors.push({ label: "Markttrend", impact: trendImpact, detail: trendDetail });

  // ── 6. Narratief ────────────────────────────────────────────────────────────
  const trendWord = trendPct >= 2 ? "gestegen" : trendPct >= 0 ? "stabiel gebleven" : "licht gedaald";
  const dominantFactor = isUltraRare ? "de extreme zeldzaamheid" : isSports ? "de sterke vraag naar sportief erfgoed" : km < 5000 ? "het uitzonderlijk lage kilometrage" : `de conditiescore van ${conditionScore}/100`;
  const narrative =
    `De ${brandName} ${modelName} is in waarde ${trendWord} ten opzichte van de aankoopprijs, met als dominante driver ${dominantFactor}. ` +
    `Op basis van ${valueHistory.length >= 2 ? "historische waarde-evolutie en" : ""} actuele marktparameters schatten we de huidige marktwaarde op ${fmtEur(estimatedValue)}.`;

  return {
    estimatedValue,
    confidence,
    trendPct,
    factors,
    narrative,
    source: "offline",
  };
}

// Kleine interne formatter (geen Intl-afhankelijkheid voor pure module).
function fmtEur(v) {
  if (v >= 1_000_000) return `€ ${(v / 1_000_000).toFixed(2).replace(".", ",")}M`;
  return `€ ${v.toLocaleString("nl-BE")}`;
}
