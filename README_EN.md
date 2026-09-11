<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Three.js-0.185-black?style=for-the-badge&logo=three.js" alt="Three.js">
</p>

<h1 align="center">🌌 Laniakea</h1>

<p align="center">
  <strong>Interactive 3D map of the Laniakea supercluster of galaxies</strong><br>
  <a href="./README.md">Overview</a> · <a href="./README_RU.md">Русский</a>
</p>

---

## About

**Laniakea** is a single-page **Next.js 16 + React 19 + TypeScript + Three.js**
application that renders the Laniakea supercluster of galaxies in 3D.

The model follows the **Cosmicflows** peculiar-velocity catalogue (Tully et al., 2014)
and shows the four regions of the supercluster, the Great Attractor, the position of
the Milky Way, and the galaxy flows falling toward the gravitational centre.

The scene runs entirely in the browser: the dataset is served statically and no
external service is required. The ambient soundtrack is synthesised procedurally with
the Web Audio API, without any audio files. Voice-over narration uses Yandex SpeechKit,
and falls back to the browser's built-in Web Speech API when no keys are configured.

> The application UI is in Russian. This document describes it in English.

## Features

### Guided tour

- **7 camera stops**: Overview → Milky Way → Great Attractor → Hydra-Centaurus →
  Pavo-Indus → Southern Supercluster → Local Supercluster.
- Smooth camera flight between stops — 1.8 s, cubic ease-in-out.
- **Russian voice-over** with a narration text for every tour stop.
- **Subtitles** synchronised with the speech: the current sentence is highlighted,
  the rest is dimmed.
- **Cosmic ambience** — a procedural drone built with the Web Audio API: a 55 Hz (A1)
  bass, an 82.4 Hz (E2) fifth, a slow filter sweep and a "cosmic dust" noise wash.

### Scene

- **~18,000 galaxies** in supergalactic coordinates — a deterministic dataset
  (Mulberry32 PRNG, seed `42`) served statically from `/api/galaxies`.
- **20 named objects** with published coordinates: Milky Way, M31, M33, Cen A, M81
  Group, Sculptor, Maffei, M87, M49, M86, and the Norma, Centaurus, Hydra, Antlia,
  Pavo, Indus, Fornax, Eridanus and Dorado clusters and groups.
- **4 regions**: Local Supercluster, Hydra-Centaurus, Pavo-Indus, Southern Supercluster.
- **Great Attractor** — a pulsing core with accretion-like rings.
- **Animated galaxy flows** toward the Great Attractor.
- **4,000 background stars** on two spherical shells.
- Galaxy points are drawn with a custom GLSL shader (soft round glowing sprites instead
  of square pixels). Spiral galaxies rotate differentially — inner regions orbit faster
  than outer ones, as in real galaxies.
- **Postprocessing**: Bloom, Vignette, SMAA.

### Tools

- **Mini-map** (XZ projection) with the camera position; clicking a landmark flies to it.
- **Scale ruler in megaparsecs**, recomputed for the current zoom level.
- **Layer panel** — the 4 regions, the neighbouring Perseus-Pisces supercluster, flows,
  the Laniakea boundary, labels, the real-galaxy mode, bloom and parallax.
- **Legend** with galaxy type colours.
- **About dialog** — facts on diameter, mass and the source catalogue.
- **Timeline of discoveries** — 15 events from Hubble (1924) to Tully (2014).
- **Supercluster comparison** — Laniakea, Perseus-Pisces, Shapley, Horologium-Reticulum,
  Pavo-Indus-Telescopium.
- **PNG screenshot**, **shareable view URL**, **tour export to JSON**.
- **First-visit onboarding overlay** (dismissal stored in `localStorage`).
- **Parallax** — a slight camera drift following the cursor after 1.5 s of idleness.

## Tech stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5 |
| **3D** | Three.js 0.185 · @react-three/fiber 9 · drei 10 · @react-three/postprocessing 3 |
| **Styling** | Tailwind CSS 4 (CSS-first, `@theme inline`) · OKLCH |
| **UI** | shadcn/ui · Radix UI · Lucide Icons |
| **Audio** | Web Audio API (ambience) · SpeechKit / Web Speech API (narration) |
| **Build** | Bun · `standalone` output |
| **Proxy** | Caddy |

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx              # Page: tour, panels, hotkeys, URL sync
│   │   ├── layout.tsx            # Metadata, Geist fonts, Toaster
│   │   ├── globals.css           # Tailwind 4, theme and --cosmic-* variables
│   │   └── api/
│   │       ├── galaxies/route.ts # Static galaxy dataset
│   │       └── tts/route.ts      # Yandex SpeechKit (optional)
│   ├── components/
│   │   ├── laniakea/             # Scene, data, panels, dialogs, hooks
│   │   └── ui/                   # shadcn/ui primitives
│   └── lib/utils.ts              # cn() helper
├── public/
├── Caddyfile                     # Reverse proxy :81 → localhost:3000
└── next.config.ts                # output: standalone
```

### Key modules

| File | Purpose |
|---|---|
| `LaniakeaCanvas.tsx` | `<Canvas>`, OrbitControls, postprocessing, `CameraRig` — flights and parallax |
| `LaniakeaScene.tsx` | Regions, Great Attractor, flows, boundary, background stars, labels |
| `galaxyData.ts` | Dataset generation, compact format, supergalactic coordinate conversion |
| `data.ts` | Descriptions of the 4 regions, the attractor, the Milky Way, facts |
| `realGalaxies.ts` | Tour narration texts, coordinate conversion |
| `GalaxyShader.tsx` | Soft glowing point shader |
| `SpiralGalaxy.tsx` | Spiral galaxies rotating in the vertex shader |
| `Panels.tsx` | Layer panel, legend, selection card |
| `MiniMap.tsx` / `ScaleRuler.tsx` | Mini-map and scale ruler |
| `useSpeech.ts` | Speech, Russian male voice selection, progress for subtitles |
| `useAmbientSound.ts` | Procedural ambience on the Web Audio API |
| `timelineData.ts` / `neighborSuperclusters.ts` | Timeline and comparison data |

## Installation and run

Requires [Bun](https://bun.sh).

```bash
git clone https://github.com/QuadDarv1ne/laniakea.git
cd laniakea

bun install
bun dev
# → http://localhost:3000
```

**No database is needed** — the application does not talk to any external store.

## Scripts

| Command | Action |
|---|---|
| `bun dev` | Dev server on port 3000, log also written to `dev.log` |
| `bun build` | Production build + copying `.next/static` and `public` into standalone |
| `bun start` | Run the standalone server, log written to `server.log` |
| `bun lint` | ESLint over the whole project |

## Environment variables

All optional. Without keys the app stays fully functional — narration uses the
browser's Web Speech API.

| Variable | Purpose |
|---|---|
| `YANDEX_API_KEY` (or `YC_API_KEY`) | Yandex SpeechKit key for server-side synthesis |
| `YC_FOLDER_ID` | Yandex Cloud folder ID for the same request |

Both are used only in `src/app/api/tts/route.ts`. Server-side synthesis uses the
`ermilov` voice, the closest available match to the male Russian "Dmitry" voice.

## Keyboard shortcuts

Both Latin and Cyrillic layouts are supported.

| Keys | Action |
|---|---|
| `←` / `→` | Previous / next tour point |
| `Space` | Toggle voice-over |
| `R` / `К` | Reset view |
| `S` / `Ы` | Screenshot to PNG |
| `L` / `Д` | 3D object labels |
| `B` / `И` | Bloom glow |
| `P` / `З` | Mouse parallax |
| `M` / `Ь` | Fly to the Milky Way |
| `?` | About dialog |

The handler ignores keystrokes inside input fields and any combination involving
`Ctrl`/`Cmd`/`Alt`, so browser shortcuts keep working.

## State in the URL

Camera position and settings are stored in the query string, so a link can be copied
and shared — the app restores the same viewpoint.

| Parameter | Meaning |
|---|---|
| `cx`, `cy`, `cz` | Camera position |
| `tx`, `ty`, `tz` | Camera target (orbit pivot) |
| `ti` | Tour stop index |
| `real` | Real-galaxy mode (`1`/`0`) |
| `bloom` | Bloom (`1`/`0`) |
| `parallax` | Parallax (`1`/`0`) |

## API

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/galaxies` | Compact galaxy dataset. Static, `revalidate = 86400`, `max-age=86400` cache |
| `POST` | `/api/tts` | Body `{ "text": "…" }` → `audio/mpeg`. Without keys it answers `503` with a hint and the client falls back to the Web Speech API |

## Data and sources

- **Tully, R. B. et al. (2014).** "The Laniakea supercluster of galaxies", *Nature* 513, 71–73 —
  supercluster boundaries and the Great Attractor.
- **Cosmicflows** — the distance and peculiar-velocity catalogue the point distribution
  is modelled on.

Background galaxies are generated deterministically from the statistical properties of
that catalogue, so the server and client copies of the dataset are identical. This is a
**representative model**, not an exact copy of the sky: only the 20 named objects carry
real published coordinates.

Scene scale: **1 Mpc = 0.55 scene units**.

## Deployment

`next.config.ts` enables `output: "standalone"`, so `bun build` produces a
self-contained build in `.next/standalone`. `Caddyfile` defines a reverse proxy
`:81 → localhost:3000` plus a separate handler for requests carrying the
`XTransformPort` query parameter.

## License

See the [LICENSE](LICENSE) file.
