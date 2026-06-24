# Higgsfield-prompts voor Maartens wagens

**Doel:** 6 foto's in exact dezelfde stijl genereren zodat ze als één luxe-catalogus ogen
en passen bij de donkere look van de RAÚ-app.

## Hoe gebruiken
1. Higgsfield: kies het meest fotorealistische model (bv. "Soul" / hoogste realisme).
2. Zet de **beeldverhouding op 16:9 (liggend)** in de instellingen — die zit ook in de prompt zelf.
3. Kopieer per wagen het **volledige promptblok** hieronder in het prompt-veld.
4. Plak het **negatief prompt** (één keer, identiek voor alle wagens) in het negatief-veld.
5. Sla op met de juiste bestandsnaam en zet in `public/cars/`.

## NEGATIEF PROMPT (zelfde voor alle 6 — in het "negative"-veld)
```
people, person, text, captions, watermark, logo overlay, dealership name, number plate text, background clutter, other cars, trees, buildings, street, trailer, showroom, motion blur, overexposed, lens flare, distorted proportions, extra wheels, cartoon, illustration
```

---

## 1 — Bugatti Chiron Super Sport → `v-chiron.jpg`
```
A Bugatti Chiron Super Sport hypercar in dark royal blue exposed carbon fibre with polished aluminium C-line and signature horseshoe grille, black diamond-cut wheels, full side profile view, parked in a minimalist dark photographic studio, seamless deep charcoal background with a soft subtle warm-to-cool gradient, glossy dark reflective floor with gentle reflection, dramatic cinematic studio lighting, crisp bright rim light tracing the car's silhouette, soft key light on the bodywork, moody luxurious color grade, ultra sharp, high detail, shot on Phase One medium format, 85mm lens, f8, low ISO, professional automotive advertising photography, photorealistic, 16:9 widescreen aspect ratio, 1920x1080
```

## 2 — Porsche 992 911 GT3 RS (Manthey Kit) → `v-gt3rs.jpg`
```
A Porsche 992 911 GT3 RS track-focused sports car finished in Arctic Grey silver with an exposed carbon-fibre bonnet featuring central NACA-duct air outlets and exposed carbon front wings, full Manthey Racing aero kit with additional carbon aero blades on top of the front wheel arches, front dive plane canards, carbon side skirts and a deep carbon front splitter, a massive black swan-neck DRS rear wing with Manthey MR logo decals, lightweight black forged centre-lock multi-spoke wheels with yellow ceramic PCCB brake calipers, wide motorsport stance, centre-exit twin exhaust tips and carbon-fibre rear diffuser, full side profile view, parked in a minimalist dark photographic studio, seamless deep charcoal background with a soft subtle warm-to-cool gradient, glossy dark reflective floor with gentle reflection, dramatic cinematic studio lighting, crisp bright rim light tracing the car's silhouette, soft key light on the bodywork, moody luxurious color grade, ultra sharp, high detail, shot on Phase One medium format, 85mm lens, f8, low ISO, professional automotive advertising photography, photorealistic, 16:9 widescreen aspect ratio, 1920x1080
```

## 3 — Bentley Continental GT Speed → `v-conti.jpg`
```
A Bentley Continental GT Speed grand tourer coupe in deep gloss Beluga black with blacked-out chrome, large gloss-black wheels, elegant muscular coupe silhouette, full side profile view, parked in a minimalist dark photographic studio, seamless deep charcoal background with a soft subtle warm-to-cool gradient, glossy dark reflective floor with gentle reflection, dramatic cinematic studio lighting, crisp bright rim light tracing the car's silhouette, soft key light on the bodywork, moody luxurious color grade, ultra sharp, high detail, shot on Phase One medium format, 85mm lens, f8, low ISO, professional automotive advertising photography, photorealistic, 16:9 widescreen aspect ratio, 1920x1080
```

## 4 — Land Rover Defender OCTA V8 → `v-octa.jpg`
```
A Land Rover Defender 110 OCTA in matte Carpathian Grey with black contrast roof, rugged off-road stance, black alloy wheels, modern boxy silhouette, full side profile view, parked in a minimalist dark photographic studio, seamless deep charcoal background with a soft subtle warm-to-cool gradient, glossy dark reflective floor with gentle reflection, dramatic cinematic studio lighting, crisp bright rim light tracing the car's silhouette, soft key light on the bodywork, moody luxurious color grade, ultra sharp, high detail, shot on Phase One medium format, 85mm lens, f8, low ISO, professional automotive advertising photography, photorealistic, 16:9 widescreen aspect ratio, 1920x1080
```

## 5 — Mercedes-AMG GT Roadster → `v-amggt.jpg`
```
A Mercedes-AMG GT Roadster convertible in matte Magno grey with soft top lowered, long bonnet, Panamericana grille, multi-spoke wheels and red brake calipers, full side profile view, parked in a minimalist dark photographic studio, seamless deep charcoal background with a soft subtle warm-to-cool gradient, glossy dark reflective floor with gentle reflection, dramatic cinematic studio lighting, crisp bright rim light tracing the car's silhouette, soft key light on the bodywork, moody luxurious color grade, ultra sharp, high detail, shot on Phase One medium format, 85mm lens, f8, low ISO, professional automotive advertising photography, photorealistic, 16:9 widescreen aspect ratio, 1920x1080
```

## 6 — Range Rover Autobiography LWB → `v-rr.jpg`
```
A Range Rover Autobiography long wheelbase SUV in gloss Santorini black with black pack trim, large 23-inch gloss-black wheels, stately minimalist silhouette, full side profile view, parked in a minimalist dark photographic studio, seamless deep charcoal background with a soft subtle warm-to-cool gradient, glossy dark reflective floor with gentle reflection, dramatic cinematic studio lighting, crisp bright rim light tracing the car's silhouette, soft key light on the bodywork, moody luxurious color grade, ultra sharp, high detail, shot on Phase One medium format, 85mm lens, f8, low ISO, professional automotive advertising photography, photorealistic, 16:9 widescreen aspect ratio, 1920x1080
```

---

## Bestandsnamen (opslaan in `public/cars/`)
| Wagen | Bestand |
|---|---|
| Bugatti Chiron Super Sport | `v-chiron.jpg` |
| Porsche 911 GT3 RS Manthey | `v-gt3rs.jpg` |
| Bentley Continental GT Speed | `v-conti.jpg` |
| Land Rover Defender OCTA V8 | `v-octa.jpg` |
| Mercedes-AMG GT Roadster | `v-amggt.jpg` |
| Range Rover Autobiography LWB | `v-rr.jpg` |

> Kleuren komen overeen met de demodata. Andere kleur gewenst? Pas de eerste zin van de prompt
> aan (en eventueel `color` in `src/demo/seed.js`).
