# Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak beide portalen (RauClient + RauAdmin) volledig bruikbaar op telefoon (≤640px), tablet (641–1023px) en laptop (≥1024px), zonder de bestaande desktop-look te veranderen.

**Architecture:** Eén gedeelde `useViewport()`-hook levert `{ width, isPhone, isTablet, isDesktop }` via één gedebouncede resize-listener. Beide componenten lezen deze waarden en passen inline-style ternaries toe op de breekpunten. Op telefoon vervangt een statische foto de Three.js-hero (perf + touch). Geen CSS-herschrijving naar classes.

**Tech Stack:** React 18, Vite, inline styles, Three.js (bestaand), vitest (unit-tests voor de hook), preview-tools (visuele verificatie).

**Verificatie-opmerking:** De hook (Taak 1) krijgt echte vitest-unit-tests (TDD). De layout-taken zijn visueel van aard en worden geverifieerd via de preview-tools op 375/768/1440px in beide thema's — niet via vitest-asserts. Dat is bewust: er bestaan geen render-tests in deze codebase en die toevoegen valt buiten scope.

---

## Bestandsstructuur

- **Nieuw:** `src/demo/useViewport.js` — gedeelde viewport-hook (één verantwoordelijkheid: viewport-zone leveren).
- **Nieuw:** `src/demo/useViewport.test.js` — unit-tests voor de hook.
- **Wijzigen:** `src/RauClient.jsx` — hook gebruiken; hero/portfolio/grids/dossier/tabellen responsive maken.
- **Wijzigen:** `src/RauAdmin.jsx` — ad-hoc `window.innerWidth`-checks vervangen door de hook; telefoon-polish.

Breakpoints (overal identiek): `isPhone = w ≤ 640`, `isTablet = 640 < w < 1024`, `isDesktop = w ≥ 1024`.

---

## Task 1: `useViewport` hook + pure `classify` (TDD)

De bestaande tests draaien in **node (geen jsdom)** en testen pure logica (zie `src/demo/__tests__/mockClient.test.js`). We volgen die huisstijl: de breakpoint-logica zit in een pure, exporteerbare `classify(w)`-functie die we unit-testen; de hook-bekabeling (resize-listener) is dun en wordt visueel geverifieerd in latere taken. **Geen** `@testing-library/react`, **geen** jsdom — geen nieuwe dev-deps.

**Files:**
- Create: `src/demo/useViewport.js`
- Test: `src/demo/__tests__/useViewport.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/demo/__tests__/useViewport.test.js
import { describe, it, expect } from "vitest";
import { classify } from "../useViewport";

describe("classify (viewport-zones)", () => {
  it("telefoon op 375px", () => {
    expect(classify(375)).toEqual({ width: 375, isPhone: true, isTablet: false, isDesktop: false });
  });
  it("tablet op 768px", () => {
    const r = classify(768);
    expect(r.isPhone).toBe(false);
    expect(r.isTablet).toBe(true);
    expect(r.isDesktop).toBe(false);
  });
  it("desktop op 1440px", () => {
    expect(classify(1440).isDesktop).toBe(true);
  });
  it("grenswaarden: 640=phone, 641=tablet, 1023=tablet, 1024=desktop", () => {
    expect(classify(640).isPhone).toBe(true);
    expect(classify(641).isTablet).toBe(true);
    expect(classify(1023).isTablet).toBe(true);
    expect(classify(1024).isDesktop).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/demo/__tests__/useViewport.test.js`
Expected: FAIL — "Failed to resolve import '../useViewport'".

- [ ] **Step 3: Write minimal implementation**

```js
// src/demo/useViewport.js
import { useState, useEffect } from "react";

// Gedeelde viewport-zone voor responsive inline-styles.
const PHONE_MAX = 640;
const DESKTOP_MIN = 1024;

// Pure, testbaar: breedte -> zone-flags.
export function classify(w) {
  return {
    width: w,
    isPhone: w <= PHONE_MAX,
    isTablet: w > PHONE_MAX && w < DESKTOP_MIN,
    isDesktop: w >= DESKTOP_MIN,
  };
}

// Hook: gedebouncede resize-listener (rAF), één per consument.
export function useViewport() {
  const [state, setState] = useState(() =>
    classify(typeof window !== "undefined" ? window.innerWidth : 1440)
  );

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setState(classify(window.innerWidth)));
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/demo/__tests__/useViewport.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full suite (geen regressie)**

Run: `npx vitest run`
Expected: alle bestaande tests + de 4 nieuwe groen.

- [ ] **Step 6: Commit**

```bash
git add src/demo/useViewport.js src/demo/__tests__/useViewport.test.js
git commit -m "feat(responsive): gedeelde useViewport-hook + classify-tests"
```

---

## Task 2: RauClient — hook bekabelen + telefoon-hero (3D→foto) + hero-labels

**Files:**
- Modify: `src/RauClient.jsx` (hook-import bovenaan; `displayMode`-init ~regel 200; 3D-effect ~regel 274; hero-blok ~regel 1316–1421; header ~regel 1264)

- [ ] **Step 1: Importeer de hook en roep ze aan**

Voeg bovenaan bij de imports toe (na regel 11):
```js
import { useViewport } from "./demo/useViewport";
```
Voeg in de component, vlak na de bestaande `useState`-declaraties (rond regel 210), toe:
```js
  const { isPhone, isTablet } = useViewport();
```

- [ ] **Step 2: Forceer foto-modus op telefoon (geen 3D laden)**

De 3D-hero is zwaar op telefoon. `displayMode` is **geen state** maar een afgeleide const (regel 268):
```js
  const displayMode = vehicle?.display_mode || "3d";
```
Vervang die regel door een telefoon-bewuste afleiding:
```js
  const displayMode = isPhone ? "image" : (vehicle?.display_mode || "3d");
```
Dat is alles: het bestaande 3D-effect (regel 274) guard al op `displayMode !== "3d"`, dus Three.js wordt niet gebouwd op telefoon, en de bestaande foto-tak (regel 1320, `displayMode === "image"`) toont de wagenfoto. Geen extra state, geen extra effect.
> `isPhone` komt uit de `useViewport()`-aanroep in Step 1, die vóór regel 268 moet staan — plaats de hook-aanroep bij de overige hook-declaraties (rond regel 210), ruim vóór regel 268.

- [ ] **Step 3: Maak hero-hoogte en -labels telefoon-proof**

Het hero-blok (regel 1317) en zijn absoluut-gepositioneerde teksten gebruiken vaste `left:36/right:36` en `fontSize:36`, wat overloopt op 375px.

Wijzig de hero-container (regel 1317) van:
```jsx
      <div style={{ height:"52vh", maxHeight:460, position:"relative", overflow:"hidden", flexShrink:0 }}>
```
naar:
```jsx
      <div style={{ height: isPhone ? "38vh" : "52vh", maxHeight: isPhone ? 320 : 460, position:"relative", overflow:"hidden", flexShrink:0 }}>
```

Wijzig "Welcome text" (regel 1369) — vervang `left:36` en `fontSize:36`:
```jsx
        <div style={{ position:"absolute", top: isPhone ? 18 : 28, left: isPhone ? 18 : 36, right: isPhone ? 18 : "auto", zIndex:5, animation:"fadeUp 0.7s ease both" }}>
          <div style={{ fontSize: isPhone ? 24 : 36, fontWeight:300, color:C.white, letterSpacing:"-0.01em", lineHeight:1.1 }}>
            Welkom terug, {firstName}
          </div>
        </div>
```

Wijzig "Value — top right" (regel 1376) — verklein op telefoon:
```jsx
          <div style={{ position:"absolute", top: isPhone ? 18 : 28, right: isPhone ? 18 : 36, zIndex:5, textAlign:"right", animation:"fadeUp 0.7s ease 0.1s both" }}>
```
en de waarde-`span` (regel 1381) `fontSize:24` → `fontSize: isPhone ? 18 : 24`.

Wijzig "Car name — bottom left" (regel 1387) `left:36` → `left: isPhone ? 18 : 36`, en de modelnaam-`div` (regel 1389) `fontSize:36` → `fontSize: isPhone ? 24 : 36`.

Wijzig "Action buttons — bottom right" (regel 1396) `right:36` → `right: isPhone ? 18 : 36`.

- [ ] **Step 4: Verifieer in de preview (telefoon)**

Start indien nodig de preview (`preview_start`), zet viewport op 375px (`preview_resize` 375×812). Log in als Maarten (DemoBar → MAARTEN). Maak een screenshot van het dashboard.
Expected: geen horizontale scroll; hero toont de wagenfoto (geen 3D-canvas); "Welkom terug" en modelnaam passen binnen het scherm; waarde rechtsboven leesbaar.

- [ ] **Step 5: Verifieer desktop ongewijzigd**

`preview_resize` 1440×900, screenshot dashboard.
Expected: 3D-hero zoals voorheen, identieke look.

- [ ] **Step 6: Commit**

```bash
git add src/RauClient.jsx
git commit -m "feat(responsive): telefoon-hero (foto i.p.v. 3D) + schaalbare hero-labels in klantportaal"
```

---

## Task 3: RauClient — portfolio-grafiek fluid + dashboard/wagens-grids

**Files:**
- Modify: `src/RauClient.jsx` (portfolio-blok ~regel 971–1160; wagens-grid regel 498; collection-value blok ~regel 1424)

- [ ] **Step 1: Portfolio key-figures & distributie 1-koloms op telefoon**

In het portfolio-blok (begint regel 971) staan grids met meerdere kolommen (key-figures, distributie). Zoek elke `gridTemplateColumns` binnen dit blok en maak ze telefoon-bewust. Patroon — vervang bv.:
```jsx
gridTemplateColumns: "repeat(3, 1fr)"
```
door:
```jsx
gridTemplateColumns: isPhone ? "1fr" : "repeat(3, 1fr)"
```
en `repeat(2, 1fr)` → `isPhone ? "1fr" : "repeat(2, 1fr)"`.
> Pas dit toe op álle multi-koloms grids in het portfolio-blok (key figures, distributie-rijen, eventuele samenvatting). De grafiek-`viewBox` zelf (regel 1066, `VW=880`) heeft al `width="100%"` + `preserveAspectRatio` en hoeft niet aangepast; controleer enkel dat de container er omheen geen vaste `maxWidth` < schermbreedte forceert die op telefoon te smal oogt — laat `maxWidth:880` staan (die is een bovengrens, geen probleem op telefoon).

- [ ] **Step 2: Wagens-grid stapelen op telefoon**

Regel 498:
```jsx
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:14 }}>
```
→
```jsx
            <div style={{ display:"grid", gridTemplateColumns: isPhone ? "1fr" : "repeat(auto-fill, minmax(320px,1fr))", gap:14 }}>
```

- [ ] **Step 3: Collection-value padding op telefoon**

Het collection-value blok (regel 1424–1425) gebruikt `padding:"0 10px 6px"` op de wrapper en `padding:"20px 22px"` op de kaart — die zijn oké. Controleer enkel dat eventuele interne grids in dit blok (verdeling per merk e.d.) `isPhone ? "1fr" : ...` krijgen, zelfde patroon als Step 1.

- [ ] **Step 4: Verifieer in de preview (telefoon)**

375px, Maarten. Navigeer naar Portfolio (via tab bar → of profielmenu). Screenshot.
Expected: grafiek vult de breedte, geen overflow; key-figures onder elkaar; distributiebalken full-width. Navigeer naar Wagens: kaarten gestapeld, full-width.

- [ ] **Step 5: Verifieer desktop (1440px) ongewijzigd**

Screenshot Portfolio + Wagens op 1440px.
Expected: meerkoloms layout zoals voorheen.

- [ ] **Step 6: Commit**

```bash
git add src/RauClient.jsx
git commit -m "feat(responsive): portfolio fluid + wagens/grids stapelen op telefoon"
```

---

## Task 4: RauClient — dossier, galerij, lightbox, tabellen, touch-targets

**Files:**
- Modify: `src/RauClient.jsx` (dossier ~regel 623–910; galerij-grid regel 854; documenten-grid regel 883; lightbox regel 902; facturen ~regel 935; berichten ~regel 1168)

- [ ] **Step 1: Dossier-secties 1-koloms op telefoon**

In het voertuig/dossier-blok (begint regel 623) staan multi-koloms grids (specs regel 713 `minmax(130px,1fr)`, documenten regel 883 `minmax(200px,1fr)`, en eventuele 2-koloms layout-wrappers). Maak elke `gridTemplateColumns` telefoon-bewust:
- Specs-grid (regel 713): laat `minmax(130px,1fr)` staan (werkt al, 2 per rij op telefoon is prima).
- Galerij-grid (regel 854): `repeat(auto-fill, minmax(130px,1fr))` → `isPhone ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(130px,1fr))"`.
- Documenten-grid (regel 883): `repeat(auto-fill, minmax(200px,1fr))` → `isPhone ? "1fr" : "repeat(auto-fill, minmax(200px,1fr))"`.
- Als het dossier een overkoepelende 2-koloms layout heeft (timeline naast documenten), zet die wrapper op `isPhone ? "1fr" : "<bestaand>"`.

- [ ] **Step 2: Lightbox full-screen + grote sluitknop**

De lightbox (regel 902) toont een `<img>`. Zorg dat de overlay een touch-vriendelijke sluitknop (≥44px) heeft. Zoek het overlay-`div` (regel ~902, `onClick={()=>setLightbox(null)}`) en voeg binnenin, vóór de `<img>`, een sluitknop toe:
```jsx
                  <div onClick={(e)=>{ e.stopPropagation(); setLightbox(null); }}
                    style={{ position:"absolute", top:16, right:16, width:44, height:44, borderRadius:"50%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </div>
```
> Controleer dat de overlay `position:"fixed", inset:0` (of vergelijkbaar full-screen) gebruikt; zo niet, maak 'm full-screen. Behoud het bestaande klik-op-achtergrond-sluit-gedrag.

- [ ] **Step 3: Facturen & berichten — geen horizontale overflow op telefoon**

Bekijk het facturen-blok (regel 935) en berichten-blok (regel 1168). Als er een tabel of rij-layout met vaste kolombreedtes is die breder is dan 375px, wikkel de scrollende inhoud in een container met `style={{ overflowX:"auto" }}`, OF zet rij-grids op `isPhone ? "1fr" : "<bestaand>"` zodat velden onder elkaar komen. Kies per blok de minst ingrijpende: factuurrijen (datum/bedrag/status) → laat horizontaal maar verklein gaps; als ze overlopen → `flexWrap:"wrap"`.
> Concreet: voeg `flexWrap:"wrap"` toe aan factuur/bericht-rij-`flex`-containers die nu `display:"flex"` met meerdere kinderen hebben en op telefoon zouden overlopen.

- [ ] **Step 4: Touch-targets ≥44px op telefoon**

Controleer interactieve elementen in het klantportaal die kleiner zijn dan 44px op telefoon (bv. de 38px action-buttons in de hero, regel 1397/1404). Op telefoon zijn die secundair; laat ze staan tenzij ze moeilijk raakbaar zijn. De primaire nav (bottom tab bar, regel 1238, height 56) voldoet al. Geen verdere wijziging nodig tenzij de preview een te kleine knop toont.

- [ ] **Step 5: Verifieer in de preview (telefoon)**

375px, Maarten. Open een wagen-dossier (Wagens → klik een wagen). Screenshot.
Expected: secties onder elkaar; galerij 2 per rij; documenten gestapeld. Open een galerijfoto → lightbox full-screen met zichtbare sluitknop rechtsboven; tik sluitknop → sluit. Ga naar Facturen en Berichten: geen horizontale scroll.

- [ ] **Step 6: Verifieer desktop (1440px)**

Screenshot dossier + facturen op 1440px.
Expected: ongewijzigde meerkoloms look.

- [ ] **Step 7: Commit**

```bash
git add src/RauClient.jsx
git commit -m "feat(responsive): dossier/galerij/lightbox/tabellen telefoon-proof in klantportaal"
```

---

## Task 5: RauAdmin — hook bekabelen + telefoon-polish

**Files:**
- Modify: `src/RauAdmin.jsx` (hook-import; `isMobile`/`isDesktop`-state ~regel 593–600; KPI-strip regel 1131; widget-grids regel 1147/1341/1429; SVG-grafiek regel 1173)

- [ ] **Step 1: Vervang de ad-hoc resize-state door de hook**

Importeer bovenaan:
```js
import { useViewport } from "./demo/useViewport";
```
Vervang het bestaande blok (regel 593–601):
```js
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktop(window.innerWidth >= 900);
    };
    window.addEventListener("resize", onResize);
    ...
  }, []);
```
door:
```js
  const vp = useViewport();
  const isMobile = vp.isPhone || vp.isTablet; // < 1024px → mobiel gedrag (was < 768)
  const isDesktop = vp.isDesktop;             // ≥ 1024px (was ≥ 900)
  const isPhone = vp.isPhone;                 // ≤ 640px → extra telefoon-polish
```
> Verwijder de oude `useEffect` met de resize-listener volledig (de hook regelt dit nu). Laat de regel-473 `window.addEventListener("resize", onR)` in de 3D-/aparte scope met rust als die bij een andere functie hoort — controleer of die bij `setIsMobile`/`setIsDesktop` hoort; zo ja, verwijder ook die. Behoud `sideOpen`-initialisatie (regel 604) maar baseer 'm op de nieuwe `isMobile`.

- [ ] **Step 2: KPI-strip 2-koloms op telefoon (5 kolommen is te smal)**

Regel 1131:
```jsx
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", ...
```
→ maak expliciet telefoon vs tablet: op tablet mogen 3 kolommen:
```jsx
        <div style={{ display: "grid", gridTemplateColumns: isPhone ? "1fr 1fr" : (isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)"), gap: isPhone ? 10 : 12, marginBottom: isPhone ? 14 : 18 }}>
```
(`isMobile` is hier tablet-bereik 641–1023 omdat `isPhone` al afgevangen is.)

- [ ] **Step 3: Widget-grids 1-koloms op telefoon**

De twee-koloms widget-layout (regel 1147 `isMobile ? "1fr" : "1fr 1fr"`) is al oké. Controleer de tier-grid (regel 1341 `isMobile ? "1fr" : "repeat(4, 1fr)"`) en pas indien nodig aan zodat tablet 2 kolommen krijgt:
```jsx
gridTemplateColumns: isPhone ? "1fr" : (isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)")
```

- [ ] **Step 4: Brede SVG-grafiek niet uit beeld**

Regel 1173 zet `minWidth: isMobile ? 320 : "auto"` op de revenue-SVG. Zorg dat de container eromheen op telefoon horizontaal kan scrollen i.p.v. de pagina te verbreden. Zoek de directe wrapper-`div` van die `<svg>` en voeg toe (indien nog niet aanwezig): `overflowX: "auto"`.

- [ ] **Step 5: Verifieer in de preview (telefoon)**

375px, DemoBar → ADMIN. Screenshot dashboard.
Expected: sidebar verborgen (slide-over via hamburger); KPI-kaarten 2 per rij; widgets onder elkaar; geen horizontale paginascroll (revenue-grafiek scrollt binnen zijn eigen kader). Open de hamburger → sidebar slide-over verschijnt.

- [ ] **Step 6: Verifieer tablet (768px) en desktop (1440px)**

768px: KPI 3 per rij, sidebar nog slide-over (want <1024). 1440px: vaste 220px-sidebar, KPI 5 per rij — ongewijzigd t.o.v. nu.
> Let op: de desktop-sidebar verschijnt nu vanaf 1024px i.p.v. 900px. Dat is bewust (consistente breakpoints). Controleer dat 900–1023px (klein laptopvenster) er nog acceptabel uitziet met slide-over.

- [ ] **Step 7: Commit**

```bash
git add src/RauAdmin.jsx
git commit -m "feat(responsive): admin gebruikt gedeelde hook + telefoon/tablet-polish"
```

---

## Task 6: Volledige verificatie (beide portalen, beide thema's) + build

**Files:** geen (alleen verificatie)

- [ ] **Step 1: Build clean**

Run: `npm run build`
Expected: succesvol (enkel de bekende chunk-size-waarschuwing).

- [ ] **Step 2: Tests groen**

Run: `npx vitest run`
Expected: alle tests groen (bestaande + 5 nieuwe).

- [ ] **Step 3: Visuele matrix in de preview**

Doorloop in de preview deze matrix en maak per cel een screenshot:

| Viewport | Portaal | Thema |
|----------|---------|-------|
| 375px | Klant (Maarten) | donker |
| 375px | Klant (Maarten) | licht |
| 375px | Admin | donker |
| 768px | Klant | donker |
| 768px | Admin | donker |
| 1440px | Klant | donker |
| 1440px | Admin | licht |

Thema wisselen via de DemoBar (☀️/🌙). Voor elke 375px-cel: controleer dat er **geen horizontale scroll** is op `document.documentElement` (`preview_eval`: `document.documentElement.scrollWidth <= window.innerWidth + 1`).
Expected: overal `true`; geen afgesneden tekst; nav bereikbaar.

- [ ] **Step 4: Toon bewijs aan de gebruiker**

Deel de belangrijkste screenshots (375px klant donker+licht, 375px admin, 1440px beide) met de gebruiker.

- [ ] **Step 5: Eind-commit indien nog losse wijzigingen**

```bash
git add -A
git commit -m "chore(responsive): verificatie-afronding" || echo "niets te committen"
```

> **Push:** pushen gebeurt apart met de `AntonSteegmans` gh-account (`gh auth switch` + `gh auth setup-git`), daarna terug naar `AntonKonradInvest`. Doe dit pas wanneer Anton het vraagt.

---

## Self-Review (uitgevoerd)

- **Spec-dekking:** breakpoints (Taak 1) ✓; useViewport-hook (Taak 1) ✓; 3D-foto-fallback telefoon (Taak 2) ✓; hero-labels (Taak 2) ✓; portfolio fluid + dashboard/wagens-grids (Taak 3) ✓; dossier/galerij/lightbox/tabellen/touch-targets (Taak 4) ✓; admin KPI/widgets/sidebar/SVG (Taak 5) ✓; verificatie 375/768/1440 beide thema's + build + tests (Taak 6) ✓. Navigatie-item uit de spec ("bottom tab bar = telefoon-nav"): de tab bar is al app-breed primair — geen aparte taak nodig, gedekt door bestaand gedrag (genoteerd in Taak 4 Step 4).
- **Placeholder-scan:** geen TBD/TODO; elke code-stap toont concrete code of een exact te zoeken landmark met regelnummer.
- **Type-/naam-consistentie:** `useViewport()` levert `{ width, isPhone, isTablet, isDesktop }` — overal zo gebruikt. In RauAdmin afgeleid naar bestaande namen `isMobile`/`isDesktop` (gedrag gedocumenteerd: <1024 = mobiel, was <768/<900).
- **Aanname om te verifiëren bij uitvoering:** exacte setter-naam van `displayMode` en exacte regelnummers (bestand evolueert) — elke taak instrueert de uitvoerder het landmark te zoeken i.p.v. blind op regelnummer te vertrouwen.
