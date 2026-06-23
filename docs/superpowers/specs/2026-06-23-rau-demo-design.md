# RAÚ — Standalone demo voor pitch aan Maarten

**Datum:** 2026-06-23
**Auteur:** Anton (met Claude)
**Status:** Ter review

---

## 1. Context & doel

De RAÚ-app draaide op een Supabase-database die niet meer bestaat (project verwijderd; een nieuw
project kost ~€10/maand). De app wordt daarom omgebouwd tot een **volledig standalone demo** die
werkt zonder database, backend of internetverbinding.

**Aanleiding:** Anton (privechauffeur) pitcht RAÚ aan zijn klant **Maarten**, een vermogende
verzamelaar met een loods vol exclusieve wagens. Doel van de demo: Maarten enthousiast maken om
(1) mee op te zetten, (2) ankerklant te worden en (3) te investeren.

**Context van de pitch:**
- Getoond op **Anton's laptop** (desktop-first; mobiel niet nodig).
- Deadline: **binnen 1-2 weken** (begin juli 2026).
- Taal: **volledig Nederlands**.
- Look: **huidige donkere stijl behouden** — geen herontwerp.
- Branding: **RAÚ** behouden.

## 2. Het concept (positionering)

RAÚ = *"private banking voor exclusieve wagens"*. Eén vertrouwd aanspreekpunt dat de volledige
collectie van een eigenaar beheert: onderhoud & herstel, stalling & climate control,
pick-up & delivery, detailing & waardebehoud — plus een **asset-/waardeoverzicht** van de collectie.

- **Positionering:** "één aanspreekpunt voor alles" (vs. versnipperde merkdealers).
- **Investeringshoek:** onontgonnen niche, first mover in Vlaanderen; de wagen als belegging.
- **Anton's edge:** bestaande vertrouwensrelaties met exact dit type klant.

## 3. Scope

### In scope
1. **Mock-datalaag** die Supabase volledig vervangt (geen kosten, geen netwerk).
2. **Personalisatie** voor Maarten: zijn naam + zijn 6 wagens als zijn collectie.
3. **Nieuwe asset-/waardelaag:** waarde-evolutie per wagen, totale collectiewaarde,
   verzekerings-/documentbeheer, conditie/km-historiek.
4. **NL-vertaling** van alle resterende Engelse data-/UI-waarden.
5. **Tiers** (Essential / Signature / Collection) met geloofwaardige prijzen.
6. **Alle vier de diensten** zichtbaar.
7. **Pitch-spiekbriefje** (apart NL-document) met verhaallijn en kernzinnen.

### Out of scope (YAGNI)
- Echte database, auth, file-uploads, betalingen.
- Mobiele optimalisatie (laptop volstaat).
- Online deploy (later te beslissen).
- Meertaligheid.
- Herontwerp van de visuele stijl.

## 4. Architectuur — de mock-laag

**Kernprincipe:** componenten (`RauAdmin.jsx`, `RauClient.jsx`) blijven zo veel mogelijk
ongewijzigd. Enkel het datatoegangspunt wordt vervangen.

### 4.1 Drop-in mock Supabase client (`src/supabase.js`)
Het origineel wordt bewaard als `src/supabase.real.js` (terugzetten = één bestand omwisselen).
De nieuwe `supabase.js` exporteert een mock-client met identiek API-oppervlak:

- `supabase.from(table)` → chainable query-builder die deze methodes ondersteunt (de set die de
  app effectief gebruikt): `.select()`, `.insert()`, `.update()`, `.delete()`, `.eq()`,
  `.order()`, `.single()`. De builder is **thenable** zodat `await supabase.from(...)...`
  een `{ data, error }`-object teruggeeft, net als de echte client.
- **Join-ondersteuning in `.select()`:** de client-queries gebruiken geneste selects zoals
  `"*, models(name, model_3d_path, year, brands(name))"` en
  `"*, vehicles(plate, models(name, brands(name)))"`. De mock parseert die select-string en
  resolvet de foreign keys (`vehicles.model_id → models`, `models.brand_id → brands`,
  `services.vehicle_id → vehicles`) tegen de store. Dit is het meest delicate deel en moet
  expliciet getest worden tegen de echte query-strings in de codebase.
- `supabase.auth` → `onAuthStateChange` vuurt onmiddellijk met een demo-sessie;
  `signInWithPassword` en `signOut` zijn no-ops die netjes resolven.
- `supabase.storage.from(...)` → `upload()` geeft `{ data: null, error: { message: "Uploads zijn
  niet beschikbaar in de demo" } }`; `getPublicUrl()` geeft een bestaande/placeholder-URL terug.

### 4.2 Store met localStorage-persistentie (`src/demo/store.js`)
- Houdt alle tabellen in geheugen als arrays van objecten.
- **Persistentie:** bij eerste load → seed laden; daarna → uit localStorage (sleutel
  `rau-demo-db`). Elke insert/update/delete schrijft terug naar localStorage. Wijzigingen
  overleven dus een refresh.
- `resetDemo()` wist localStorage en herlaadt de seed. Gekoppeld aan een kleine **reset-knop**.
- Genereert id's voor inserts (eenvoudige uuid-achtige string; `Date.now`/`Math.random` mogen niet
  in workflow-scripts, maar in app-runtime is dat geen probleem).

### 4.3 Seed-data (`src/demo/seed.js`)
Genormaliseerde data passend bij het bestaande schema: `brands`, `models`, `vehicles`, `clients`,
`profiles`, `team`, `services`, `invoices`, `messages` — plus de nieuwe asset-velden (§6).
Gebaseerd op de bestaande in-code arrays in `RauAdmin.jsx`, maar **gepersonaliseerd voor Maarten**
en aangevuld met enkele fictieve klanten zodat het admingedeelte gevuld oogt.

### 4.4 Login & rol (`src/main.jsx`)
- Inlogscherm wordt overgeslagen; de app start direct.
- Een kleine, discrete **rol-schakelaar** (zwevend, bv. rechtsboven) wisselt tussen
  **Admin** en **Maartens klantportaal**. Rol bewaard in localStorage (`rau-demo-role`,
  default `admin`). "Uitloggen" toont opnieuw de schakelaar i.p.v. een loginscherm.

## 5. Personalisatie — Maartens collectie

Maarten is de gekoppelde klant van het klantportaal. Zijn 6 wagens (waarden indicatief, fijn te
stellen):

| Wagen | Bouwjaar | Geschatte waarde | Opmerking |
|---|---|---|---|
| Bugatti Chiron Super Sport | 2022 | ~€3.800.000 | **Kroonjuweel / 3D-showcase**, sterk appreciërend |
| Porsche 992 911 GT3 RS — Manthey Racing Kit | 2023 | ~€320.000 | Appreciërend, collector's item |
| Bentley Continental GT Speed | 2023 | ~€285.000 | |
| Land Rover Defender OCTA V8 | 2024 | ~€190.000 | |
| Mercedes-AMG GT Roadster | 2024 | ~€185.000 | |
| Range Rover (Autobiography) | 2024 | ~€165.000 | |
| **Totaal** | | **~€4.945.000** | Domineerd door de Bugatti |

- **3D vs. foto:** technische keuze van de bouwer. Aanbeveling: Bugatti (kroonjuweel) in 3D indien
  een licht/beschikbaar model bestaat; overige wagens met foto's. Geen tijd verliezen aan zware
  3D-modellen.
- Maarten staat op de **Collection**-tier (§7).

## 6. Nieuwe asset-/waardelaag

Bestaat nog niet in de app; wordt toegevoegd. Vier onderdelen:

1. **Waarde-evolutie per wagen** — aankoopwaarde → huidige geschatte marktwaarde (eenvoudige
   lijn/sparkline). Narratief: Bugatti + GT3 RS stijgen, rest licht dalend → collectie netto
   positief.
2. **Totale collectiewaarde** — één groot cijfer + trend op het klantdashboard (en op de
   klantdetailpagina in admin). Het "portfolio"-gevoel.
3. **Verzekerings- & documentbeheer** — per wagen een lijstje documenten (polis, keuring,
   facturen, eigendomsbewijs) met status/datum. Statisch in de demo (geen echte bestanden).
4. **Conditie / km-historiek** — km-stand en conditiescore per wagen als waardedrijvers.

**Datamodel-uitbreiding (vehicles):** velden zoals `purchase_value`, `current_value`,
`value_history` (array van {datum, waarde}), `condition_score`, `documents` (array). Exacte
kolomnamen afstemmen op de bestaande `vehicles`-structuur tijdens implementatie. Omdat alles mock
is, kunnen velden vrij toegevoegd worden zonder migratie.

**UI:** toegevoegd binnen de bestaande donkere stijl — collectiewaarde op het klantdashboard, een
waarde-/documentblok op de wagendetailweergave. Geen nieuwe navigatie-paradigma's.

## 7. Tiers (abonnementen, per wagen/maand)

Geloofwaardige set voor het Vlaamse topsegment:

| Tier | Prijs/maand | Inbegrepen |
|---|---|---|
| **Essential** | €750 | Climate-controlled stalling, basismonitoring, keuring-coördinatie |
| **Signature** | €1.500 | + onderhoud-coördinatie, pick-up & delivery, 2× detailing/jaar, waardeopvolging |
| **Collection** | €2.950 | + volledige conciërge & prioriteit, onbeperkt transport, kwartaaldetailing, verzekerings- & documentbeheer, persoonlijke accountmanager |

Bedragen zijn indicatief en mogen vóór de pitch nog bijgesteld worden.

## 8. NL-vertaling

Labels in de navigatie zijn al NL. Te vertalen zijn data-/UI-*waarden*, o.a.:
- Service-types: "Full Service" → "Volledige beurt", "Tire Change" → "Bandenwissel",
  "Pickup & Detailing" → "Ophaling & detailing", "Storage Prep" → "Stallingsvoorbereiding",
  "Annual Inspection" → "Jaarlijkse keuring".
- Team-rollen: "Lead Technician" → "Hoofdtechnicus", "Detailing Specialist" →
  "Detailing-specialist", "Technician" → "Technicus", "Client Relations" → "Klantenrelaties".
- Overige losse Engelse strings die tijdens implementatie opduiken.

## 9. Deliverables

1. Werkende standalone demo-app (`npm run dev`), draaiend zonder database.
2. Pitch-spiekbriefje (`docs/pitch-maarten.md`): verhaallijn
   (Maartens portaal → kroonjuweel-wagen → collectiewaarde → service → admin achter de schermen),
   kernzinnen en de "ask".

## 10. Risico's & aandachtspunten

- **Join-parsing in de mock** is het grootste technische risico — moet getest worden tegen de
  exacte select-strings die `RauClient.jsx` en `RauAdmin.jsx` gebruiken.
- **Bestaande `vehicles`-kolommen** zijn niet volledig zichtbaar in de repo (tabel bestond al vóór
  schema.sql); kolomnamen verifiëren tijdens implementatie tegen de query's in de componenten.
- **localStorage-limiet** (~5 MB): geen zware data-URL's opslaan; uploads zijn daarom uitgeschakeld.
- **Waardecijfers** zijn indicatief; Anton stemt ze finaal af zodat ze geloofwaardig zijn voor
  iemand die de markt kent.
