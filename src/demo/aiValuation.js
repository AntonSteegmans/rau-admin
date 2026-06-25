// src/demo/aiValuation.js — optionele live Claude-waardeschatting
// Default: offline simulatie. Live modus pas actief als gebruiker key invoert.
import { estimateValuation } from "./valuation.js";

const LS_LIVE = "rau-ai-live";
const LS_KEY  = "rau-anthropic-key";

/* ── localStorage helpers ───────────────────────────────────────────────── */
export function isLiveEnabled() {
  try { return localStorage.getItem(LS_LIVE) === "1"; } catch { return false; }
}
export function setLiveEnabled(bool) {
  try { localStorage.setItem(LS_LIVE, bool ? "1" : "0"); } catch {}
}
export function getApiKey() {
  try { return localStorage.getItem(LS_KEY) ?? ""; } catch { return ""; }
}
export function setApiKey(str) {
  try { localStorage.setItem(LS_KEY, str ?? ""); } catch {}
}

/* ── Live Claude call ───────────────────────────────────────────────────── */
async function callClaude(vehicle) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({
    apiKey: getApiKey(),
    dangerouslyAllowBrowser: true,
    defaultHeaders: { "anthropic-dangerous-direct-browser-access": "true" },
  });

  const brandName  = vehicle.models?.brands?.name ?? "onbekend merk";
  const modelName  = vehicle.models?.name ?? "onbekend model";
  const year       = vehicle.models?.year ?? "";
  const mileage    = vehicle.mileage ?? "onbekend";
  const color      = vehicle.color ?? "onbekend";
  const condition  = vehicle.condition_score ?? "onbekend";
  const purchase   = vehicle.purchase_value ?? 0;
  const current    = vehicle.current_value ?? vehicle.value ?? 0;
  const history    = Array.isArray(vehicle.value_history)
    ? vehicle.value_history.map(p => `${p.d}: €${p.v.toLocaleString("nl-BE")}`).join(", ")
    : "geen data";

  const prompt = `Je bent een expert in de Europese markt voor luxe en collector-auto's.
Geef een realistische marktwaardeschatting voor het volgende voertuig. Antwoord uitsluitend in het Nederlands.

VOERTUIG:
- Merk: ${brandName}
- Model: ${modelName}${year ? ` (${year})` : ""}
- Kleur: ${color}
- Kilometerstand: ${mileage}
- Conditiescore: ${condition}/100
- Aankoopwaarde: €${purchase.toLocaleString("nl-BE")}
- Huidige boekwaarde: €${current.toLocaleString("nl-BE")}
- Waarde-evolutie: ${history}

Analyseer de marktpositie en geef:
1. Een realistische geschatte marktwaarde in EUR (estimatedValue, getal)
2. Een betrouwbaarheidspercentage (confidence, 0-100)
3. Het waardeveranderingspercentage t.o.v. aankoopprijs (trendPct, één decimaal)
4. Een verhalende samenvatting van 1-2 zinnen in het Nederlands (narrative)
5. Precies 3 tot 4 factoren (factors), elk met:
   - label: één van: "Kilometerstand", "Conditie", "Zeldzaamheid", "Markttrend"
   - impact: exact "positief", "neutraal" of "negatief"
   - detail: korte Nederlandse toelichting (max 12 woorden)

Houd de schattingen indicatief en marktrealistisch voor de EU-verzamelmarkt. Antwoord als JSON.`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      estimatedValue: { type: "number" },
      confidence:     { type: "number" },
      trendPct:       { type: "number" },
      narrative:      { type: "string" },
      factors: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label:  { type: "string" },
            impact: { type: "string" },
            detail: { type: "string" },
          },
          required: ["label", "impact", "detail"],
        },
      },
    },
    required: ["estimatedValue", "confidence", "trendPct", "narrative", "factors"],
  };

  const resp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    tools: [{
      name: "market_valuation",
      description: "Gestructureerde marktwaardeschatting voor een collector-auto.",
      input_schema: schema,
    }],
    tool_choice: { type: "tool", name: "market_valuation" },
  });

  if (resp.stop_reason === "refusal") throw new Error("refusal");

  // Probeer eerst tool_use block, dan text block als JSON
  const toolUse = resp.content.find(b => b.type === "tool_use");
  if (toolUse?.input) {
    return toolUse.input;
  }
  const textBlock = resp.content.find(b => b.type === "text");
  if (!textBlock) throw new Error("Geen bruikbaar antwoord van Claude");
  return JSON.parse(textBlock.text);
}

/* ── Publieke API ───────────────────────────────────────────────────────── */
/**
 * Geeft een waardeschatting voor een voertuig.
 * - Offline (default): synchroon, deterministisch, altijd beschikbaar.
 * - Live: roept Claude aan als isLiveEnabled() && getApiKey() niet leeg.
 *   Bij ANY fout valt het terug op offline met source "offline-fallback".
 * @param {object} vehicle
 * @returns {Promise<{ estimatedValue, confidence, trendPct, factors, narrative, source }>}
 */
export async function aiValuation(vehicle) {
  if (!isLiveEnabled() || !getApiKey()) {
    return estimateValuation(vehicle);
  }
  try {
    const data = await callClaude(vehicle);
    return { ...data, source: "claude" };
  } catch (err) {
    console.warn("[aiValuation] Claude call mislukt, terugval naar offline:", err?.message ?? err);
    return { ...estimateValuation(vehicle), source: "offline-fallback" };
  }
}
