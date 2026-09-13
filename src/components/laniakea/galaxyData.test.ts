import { describe, expect, test } from "bun:test";
import {
  buildDataset,
  fromCompactDataset,
  generateRealisticGalaxyField,
  NOTABLE_GALAXIES,
  supergalacticToCartesian,
  toCompactDataset,
  type Galaxy,
} from "./galaxyData";

describe("supergalacticToCartesian", () => {
  test("sgl=0, sgb=0 lies on the +X axis", () => {
    const [x, y, z] = supergalacticToCartesian(0, 0, 10);
    expect(x).toBeCloseTo(10, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  test("sgl=90, sgb=0 lies on the +Z axis", () => {
    const [x, y, z] = supergalacticToCartesian(90, 0, 5);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(5, 6);
  });

  test("sgb=90 lies on the +Y axis regardless of longitude", () => {
    const [x, y, z] = supergalacticToCartesian(137, 90, 3);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(3, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  test("vector length equals distance", () => {
    for (const [sgl, sgb] of [
      [0, 0],
      [45, 30],
      [162, -5],
      [241, -18],
    ] as const) {
      const [x, y, z] = supergalacticToCartesian(sgl, sgb, 62);
      const len = Math.sqrt(x * x + y * y + z * z);
      expect(len).toBeCloseTo(62, 6);
    }
  });
});

describe("compact dataset serialization", () => {
  const sample: Galaxy[] = [
    { name: "Milky Way", sgl: 0, sgb: 0, distance: 0, type: "spiral", velocity: 0, magnitude: -20.6 },
    { name: "Milky Way", sgl: 1, sgb: 1, distance: 1, type: "elliptical" },
    { sgl: 121, sgb: -22, distance: 0.78, type: "spiral", velocity: -110, magnitude: -21.5 },
  ];

  test("roundtrip preserves galaxy fields", () => {
    const restored = fromCompactDataset(toCompactDataset(sample));
    expect(restored).toHaveLength(sample.length);
    for (let i = 0; i < sample.length; i++) {
      expect(restored[i].sgl).toBeCloseTo(sample[i].sgl, 6);
      expect(restored[i].sgb).toBeCloseTo(sample[i].sgb, 6);
      expect(restored[i].distance).toBeCloseTo(sample[i].distance, 6);
      expect(restored[i].type).toBe(sample[i].type);
    }
  });

  test("duplicate names share one entry in the names table", () => {
    const compact = toCompactDataset(sample);
    expect(compact.names).toEqual(["Milky Way"]);
    expect(compact.count).toBe(sample.length);
  });

  test("missing velocity/magnitude fall back to defaults", () => {
    const restored = fromCompactDataset(toCompactDataset(sample));
    expect(restored[1].velocity).toBe(0);
    expect(restored[1].magnitude).toBe(-16);
    expect(restored[1].name).toBe("Milky Way");
  });
});

describe("generateRealisticGalaxyField", () => {
  test("is deterministic for the same seed", () => {
    const a = generateRealisticGalaxyField(100, 42);
    const b = generateRealisticGalaxyField(100, 42);
    expect(a).toEqual(b);
  });

  test("produces the requested count", () => {
    expect(generateRealisticGalaxyField(500, 42)).toHaveLength(500);
  });

  test("different seeds produce different fields", () => {
    const a = generateRealisticGalaxyField(100, 42);
    const b = generateRealisticGalaxyField(100, 7);
    expect(a).not.toEqual(b);
  });

  test("keeps supergalactic latitude within ±30°", () => {
    const field = generateRealisticGalaxyField(2000, 42);
    for (const g of field) {
      expect(g.sgb).toBeGreaterThanOrEqual(-30);
      expect(g.sgb).toBeLessThanOrEqual(30);
    }
  });
});

describe("buildDataset", () => {
  test("starts with notable galaxies that all have names", () => {
    const data = buildDataset(100, 42);
    expect(data.length).toBe(NOTABLE_GALAXIES.length + 100);
    const head = data.slice(0, NOTABLE_GALAXIES.length);
    for (const g of head) {
      expect(g.name).toBeDefined();
    }
    expect(head[0].name).toBe("Milky Way");
  });
});
