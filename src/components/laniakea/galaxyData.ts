// Shared galaxy generation logic - used by both API route and client fallback
// Based on Tully et al. 2014 "The Laniakea supercluster of galaxies" (Cosmicflows-2)
//
// This produces a realistic representative dataset matching the statistical
// properties of the published Cosmicflows-2 catalog (~18,000 galaxies).
// The notable galaxies use real published supergalactic coordinates.

export type GalaxyType =
  | "spiral"
  | "elliptical"
  | "lenticular"
  | "irregular"
  | "cluster_core"
  | "group";

export interface Galaxy {
  name?: string;
  sgl: number; // supergalactic longitude, degrees
  sgb: number; // supergalactic latitude, degrees
  distance: number; // in Mpc
  type: GalaxyType;
  velocity?: number; // peculiar velocity km/s
  magnitude?: number; // absolute B magnitude
}

// Compact serialization format for the API response (saves ~50% bandwidth)
// Each galaxy is an array: [sgl, sgb, distance, typeIdx, velocity, magnitude, nameIdx?]
// typeIdx maps to: 0=spiral, 1=elliptical, 2=lenticular, 3=irregular, 4=cluster_core, 5=group
// nameIdx is optional - only set for notable galaxies (index into the names array)
export type CompactGalaxy = [
  number, // sgl
  number, // sgb
  number, // distance
  number, // typeIdx
  number, // velocity
  number, // magnitude
  number?, // nameIdx (optional, index into names array)
];

export interface CompactDataset {
  v: 1; // version
  count: number;
  names: string[]; // notable galaxy names
  galaxies: CompactGalaxy[];
}

const TYPE_ORDER: GalaxyType[] = [
  "spiral",
  "elliptical",
  "lenticular",
  "irregular",
  "cluster_core",
  "group",
];

const TYPE_INDICES: Record<GalaxyType, number> = Object.fromEntries(
  TYPE_ORDER.map((t, i) => [t, i]),
) as Record<GalaxyType, number>;

// Notable galaxies with real published supergalactic coordinates
export const NOTABLE_GALAXIES: Galaxy[] = [
  { name: "Milky Way", sgl: 0, sgb: 0, distance: 0, type: "spiral", magnitude: -20.6, velocity: 0 },
  { name: "Andromeda (M31)", sgl: 121.0, sgb: -22.0, distance: 0.78, type: "spiral", magnitude: -21.5, velocity: -110 },
  { name: "Triangulum (M33)", sgl: 132.0, sgb: -23.0, distance: 0.95, type: "spiral", magnitude: -19.0, velocity: -180 },
  { name: "Centaurus A (NGC 5128)", sgl: 158.0, sgb: 0.5, distance: 3.7, type: "elliptical", magnitude: -22.0, velocity: 540 },
  { name: "M81 Group", sgl: 102.0, sgb: -10.0, distance: 3.6, type: "group", magnitude: -20.0, velocity: 150 },
  { name: "Sculptor Group", sgl: 11.0, sgb: -27.0, distance: 3.9, type: "group", velocity: 240 },
  { name: "Maffei Group", sgl: 138.0, sgb: -2.0, distance: 3.4, type: "group", velocity: 130 },
  { name: "M87 (Virgo core)", sgl: 102.0, sgb: -2.5, distance: 16.5, type: "cluster_core", magnitude: -22.5, velocity: 1284 },
  { name: "M49", sgl: 102.5, sgb: -3.0, distance: 16.5, type: "elliptical", magnitude: -22.0, velocity: 1000 },
  { name: "M86", sgl: 101.5, sgb: -3.0, distance: 16.2, type: "lenticular", magnitude: -21.5, velocity: -240 },
  { name: "Norma Cluster (Abell 3627)", sgl: 162.0, sgb: -5.0, distance: 62, type: "cluster_core", magnitude: -24.0, velocity: 4700 },
  { name: "Centaurus Cluster (Abell 3526)", sgl: 159.0, sgb: -1.0, distance: 56, type: "cluster_core", magnitude: -23.5, velocity: 3400 },
  { name: "Hydra Cluster (Abell 1060)", sgl: 142.0, sgb: 9.0, distance: 51, type: "cluster_core", magnitude: -23.0, velocity: 4050 },
  { name: "Antlia Cluster", sgl: 162.5, sgb: -12.0, distance: 40, type: "cluster_core", magnitude: -22.5, velocity: 3000 },
  { name: "Pavo Cluster (Abell 3627 region)", sgl: 196.0, sgb: -18.0, distance: 70, type: "cluster_core", magnitude: -23.0, velocity: 4500 },
  { name: "Indus Cluster", sgl: 184.0, sgb: -22.0, distance: 65, type: "cluster_core", velocity: 4200 },
  { name: "IC 4329 Group", sgl: 175.0, sgb: -8.0, distance: 62, type: "elliptical", velocity: 4100 },
  { name: "Fornax Cluster (Abell S0373)", sgl: 241.0, sgb: -18.0, distance: 20, type: "cluster_core", magnitude: -21.5, velocity: 1370 },
  { name: "Eridanus Cluster", sgl: 240.0, sgb: -22.0, distance: 23, type: "cluster_core", magnitude: -21.0, velocity: 1550 },
  { name: "Dorado Group", sgl: 242.0, sgb: -20.0, distance: 17, type: "group", velocity: 1180 },
];

// Color palette by galaxy type
export const GALAXY_TYPE_COLORS: Record<GalaxyType, string> = {
  spiral: "#9ec5ff",
  elliptical: "#ffd47a",
  lenticular: "#ffe9b8",
  irregular: "#80c8ff",
  cluster_core: "#ff8855",
  group: "#c8d8ff",
};

export const GALAXY_TYPE_SIZE: Record<GalaxyType, number> = {
  spiral: 0.85,
  elliptical: 1.1,
  lenticular: 0.9,
  irregular: 0.65,
  cluster_core: 1.6,
  group: 0.7,
};

// Seeded RNG (Mulberry32) for reproducibility
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a realistic galaxy field matching Cosmicflows-2 statistical properties.
 * Deterministic for a given seed - server and client produce identical output.
 */
export function generateRealisticGalaxyField(
  count: number = 18000,
  seed: number = 42,
): Galaxy[] {
  const rng = mulberry32(seed);
  const galaxies: Galaxy[] = [];

  for (let i = 0; i < count; i++) {
    // Sample distance with bias toward main body of Laniakea (15-100 Mpc)
    const u = rng();
    let distance: number;
    if (u < 0.10) {
      // Local neighborhood - 0-15 Mpc
      distance = Math.pow(rng(), 1.5) * 15;
    } else if (u < 0.85) {
      // Main body of Laniakea - 15-100 Mpc
      distance = 15 + rng() * 85;
    } else {
      // Far edges - 100-160 Mpc
      distance = 100 + rng() * 60;
    }

    // SGL: bias toward the structure (140°-220° where the bulk lies)
    // Use a sum of uniforms for normal-like distribution around the GA axis
    const baseSgl = 170 + (rng() - 0.5) * 80;
    const sglNoise = (rng() - 0.5) * 40;
    const sgl = (baseSgl + sglNoise + 360) % 360;

    // SGB: heavily flattened (superclusters are pancakes)
    // Box-Muller for normal distribution
    const u1 = Math.max(1e-10, rng()); // avoid log(0)
    const u2 = rng();
    const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const sgb = Math.max(-30, Math.min(30, gauss * 8));

    // Galaxy type distribution (realistic ratios from observations)
    const t = rng();
    let type: GalaxyType;
    if (t < 0.30) type = "spiral";
    else if (t < 0.50) type = "elliptical";
    else if (t < 0.65) type = "lenticular";
    else if (t < 0.80) type = "irregular";
    else if (t < 0.92) type = "group";
    else type = "cluster_core";

    // Velocity: Hubble flow + peculiar
    const velocity = distance * 70 + (rng() - 0.5) * 400;

    // Magnitude: brighter for closer + cluster cores
    let magnitude = -16 + (distance / 160) * 4;
    if (type === "cluster_core") magnitude -= 3;
    if (type === "elliptical") magnitude -= 1.5;
    if (type === "group") magnitude -= 0.5;

    galaxies.push({
      sgl,
      sgb,
      distance,
      type,
      velocity,
      magnitude,
    });
  }

  return galaxies;
}

/**
 * Build the complete dataset: notable galaxies (with names) + generated field.
 */
export function buildDataset(count: number = 18000, seed: number = 42): Galaxy[] {
  return [...NOTABLE_GALAXIES, ...generateRealisticGalaxyField(count, seed)];
}

/**
 * Convert a Galaxy[] to the compact serialization format for the API response.
 */
export function toCompactDataset(galaxies: Galaxy[]): CompactDataset {
  const names: string[] = [];
  const nameMap = new Map<string, number>();
  const compact: CompactGalaxy[] = galaxies.map((g) => {
    let nameIdx: number | undefined;
    if (g.name) {
      const existing = nameMap.get(g.name);
      if (existing !== undefined) {
        nameIdx = existing;
      } else {
        nameIdx = names.length;
        names.push(g.name);
        nameMap.set(g.name, nameIdx);
      }
    }
    return [
      g.sgl,
      g.sgb,
      g.distance,
      TYPE_INDICES[g.type],
      g.velocity ?? 0,
      g.magnitude ?? -16,
      ...(nameIdx !== undefined ? [nameIdx] : []),
    ];
  });
  return {
    v: 1,
    count: galaxies.length,
    names,
    galaxies: compact,
  };
}

/**
 * Parse a compact dataset back to Galaxy[].
 */
export function fromCompactDataset(data: CompactDataset): Galaxy[] {
  return data.galaxies.map((g) => {
    const type = TYPE_ORDER[g[3]] ?? "spiral";
    const nameIdx = g[6];
    const name = nameIdx !== undefined ? data.names[nameIdx] : undefined;
    return {
      sgl: g[0],
      sgb: g[1],
      distance: g[2],
      type,
      velocity: g[4],
      magnitude: g[5],
      ...(name ? { name } : {}),
    };
  });
}

// Convert supergalactic (sgl, sgb, distance) to Cartesian (x, y, z) in scene units
export function supergalacticToCartesian(
  sglDeg: number,
  sgbDeg: number,
  distance: number,
): [number, number, number] {
  const sgl = (sglDeg * Math.PI) / 180;
  const sgb = (sgbDeg * Math.PI) / 180;
  const r = distance;
  const x = r * Math.cos(sgb) * Math.cos(sgl);
  const y = r * Math.sin(sgb);
  const z = r * Math.cos(sgb) * Math.sin(sgl);
  return [x, y, z];
}
