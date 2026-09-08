import { NextResponse } from "next/server";
import { buildDataset, toCompactDataset } from "@/components/laniakea/galaxyData";

// Force static generation - the dataset is deterministic (seeded RNG)
// so it can be cached at build time and served from CDN.
export const dynamic = "force-static";
export const revalidate = 86400; // re-validate once per day

// Module-level cache so the dataset is generated only once per server lifetime
let cachedCompact: ReturnType<typeof toCompactDataset> | null = null;

function getDataset() {
  if (!cachedCompact) {
    // ~18,000 galaxies to match the published Cosmicflows-2 catalog size
    // (Tully et al. 2013 reported 8,164 distances; Cosmicflows-3 reported ~18,000)
    const galaxies = buildDataset(18000, 42);
    cachedCompact = toCompactDataset(galaxies);
  }
  return cachedCompact;
}

export async function GET() {
  const dataset = getDataset();
  return NextResponse.json(dataset, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
