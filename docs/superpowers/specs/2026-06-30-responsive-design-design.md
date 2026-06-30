# RAÚ — Responsive Design (telefoon + tablet + laptop)

**Datum:** 2026-06-30
**Status:** ontwerp ter review
**Doel:** Beide portalen (klant + admin) volledig bruikbaar maken op telefoon, tablet én laptop, zodat Maarten de demo ook op zijn iPhone/iPad kan openen zonder dat iets breekt of hapert.

## Context

De demo was laptop-first gebouwd. RauAdmin heeft al gedeeltelijke responsive-logica (`isMobile`/`isDesktop` via `window.innerWidth` + resize-listener, mobiele slide-over sidebar, stapelende grids). RauClient — het portaal dat Maarten ziet — heeft vrijwel geen responsive-logica: 3D-hero, portfolio-grafiek (vaste `width 880`), dossier, galerij en tabellen zijn allemaal laptop-first.

Codebase-stijl: React 18 + Vite, grote single-file componenten met **uitsluitend inline styles** (geen CSS-bestanden, op geïnjecteerde `<style>`-tags na). De responsive-aanpak moet hierbij passen.

## Aanpak

Gekozen: **gedeelde `useViewport()`-hook + inline-style breakpoints** (optie A uit de brainstorm). Sluit aan bij het bestaande patroon in RauAdmin, minimale churn, geen CSS-herschrijving, en laat ons op telefoon ook *gedrag* wijzigen (3D vervangen door foto). Verworpen: CSS media queries via classes (optie B) en container queries (optie C) — beide vereisen een grote herschrijving van honderden inline-style objecten met weinig meerwaarde voor een demo.

## Breakpoints

| Zone | Breedte | Toestel |
|------|---------|---------|
| Phone | `≤ 640px` | iPhone staand |
| Tablet | `641–1023px` | iPad staand/liggend |
| Desktop | `≥ 1024px` | laptop (huidige look ongemoeid) |

## Componenten

### `src/demo/useViewport.js` (nieuw)

Eén gedeelde hook, één resize-listener per consument, debounced via `requestAnimationFrame`.

```
useViewport() → { width, isPhone, isTablet, isDesktop }
```

- `isPhone = width <= 640`
- `isTablet = width > 640 && width < 1024`
- `isDesktop = width >= 1024`
- Initialiseert met `window.innerWidth`; ruimt de listener op bij unmount.

Beide portalen vervangen hun ad-hoc `window.innerWidth`-checks hierdoor. RauAdmin's bestaande `isMobile`/`isDesktop` worden afgeleid van deze hook (`isMobile ≈ isPhone || isTablet` waar nu `<768` gebruikt wordt; verifiëren per gebruiksplek dat gedrag gelijk blijft) — geen dubbele listeners.

### 3D-hero op telefoon (gedragskeuze)

De Three.js-viewer is op telefoon zwaar (GPU, download, touch-rotatie botst met scrollen).

- **Phone:** 3D niet laden → toon de bestaande wagenfoto (`public/cars/*.jpg`) met een subtiele "tap voor 3D"-knop die de viewer optioneel alsnog laadt. Bespaart batterij/data, scrollt vlot.
- **Tablet + desktop:** 3D zoals nu; hoogte schaalt mee met de viewport.

## Per-view aanpassingen

### Klantportaal (RauClient)

- **Navigatie:** bottom tab bar = telefoon-nav (bestaat al) → tonen op phone, top-nav op desktop. Tablet: top-nav compacter.
- **Dashboard:** kaarten-grid → 1 kolom op phone, 2 op tablet.
- **Wagens-lijst:** kaarten full-width gestapeld op phone.
- **Portfolio:** grafiek van vaste `width 880` → fluid `viewBox` + `width:100%`; key-figures grid 3→1 kolom op phone; distributie-balken full-width. (Grootste huidige breekpunt.)
- **Dossier:** timeline + documenten + concierge in 1 kolom op phone; galerij-grid 3→2 koloms; lightbox full-screen met sluit-knop ≥44px touch-target.
- **Facturen / berichten:** tabellen → kaart-layout op phone (geen horizontale scroll).
- **Touch-targets:** knoppen/links min. 44px hoog op phone.

### Admin (RauAdmin)

- **KPI-strip:** `repeat(5,1fr)` → 2 koloms op phone; DemoBar-overlap-padding ook op phone controleren.
- **Widgets:** revenue / pipeline / tier / team grids consequent 1-koloms op phone.
- **Sidebar:** slide-over op phone (bestaat); breakpoint herleiden naar de gedeelde hook voor consistentie.
- **Brede SVG-grafieken:** `minWidth:320` controleren zodat ze niet uit beeld lopen, met `overflow-x:auto` waar nodig.

## Niet in scope (YAGNI)

- Geen CSS-herschrijving naar classes/media queries.
- Geen nieuwe layout-paradigma's; bestaande look op desktop blijft identiek.
- Geen aanpassingen aan de print/PDF-rapporten (die zijn al apart via `@media print`).

## Testen / verificatie

Na implementatie in de preview testen op **375px (iPhone), 768px (iPad), 1440px (laptop)**, beide portalen, licht én donker thema. Screenshots als bewijs. `npm run build` clean en bestaande vitest-suite (11 tests) blijft groen.
