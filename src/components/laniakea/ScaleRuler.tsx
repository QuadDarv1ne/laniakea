"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface ScaleRulerProps {
  cameraPos: THREE.Vector3 | null;
  cameraTarget: THREE.Vector3 | null;
}

// Same scale as LaniakeaScene: 1 Mpc = 0.55 scene units
const MPC_TO_SCENE = 0.55;

/**
 * Scale ruler overlay showing actual astronomical distances.
 * Computes a "nice" round number of Mpc that fits in ~80px at the current
 * zoom level, and displays it as a ruler bar with a label.
 *
 * This gives the user a sense of the enormous scale of Laniakea.
 */
export function ScaleRuler({ cameraPos, cameraTarget }: ScaleRulerProps) {
  const { pixelsPerMpc, rulerMpc, rulerPx, label } = useMemo(() => {
    if (!cameraPos || !cameraTarget) {
      return {
        pixelsPerMpc: 0,
        rulerMpc: 0,
        rulerPx: 0,
        label: "",
      };
    }

    // Distance from camera to target = zoom level
    const dist = cameraPos.distanceTo(cameraTarget);
    // FOV is 50°, so the visible width at distance `dist` is:
    //   width = 2 * dist * tan(fov/2)
    const fov = 50 * (Math.PI / 180);
    const visibleWidthScene = 2 * dist * Math.tan(fov / 2);
    // Convert to Mpc
    const visibleWidthMpc = visibleWidthScene / MPC_TO_SCENE;
    // Assume the ruler occupies ~120px and the viewport is ~800px wide
    const viewportWidthPx = 800;
    const pixelsPerMpc = viewportWidthPx / visibleWidthMpc;
    const targetRulerPx = 120;
    const rulerMpcExact = targetRulerPx / pixelsPerMpc;

    // Pick a "nice" round number ≤ rulerMpcExact
    const niceNumbers = [
      1, 2, 5, 10, 20, 50, 100, 200, 500,
    ];
    let rulerMpc = 1;
    for (const n of niceNumbers) {
      if (n <= rulerMpcExact) rulerMpc = n;
    }
    const rulerPx = rulerMpc * pixelsPerMpc;

    // Format label: convert Mpc to million light years (1 Mpc ≈ 3.262 Mly)
    const mly = rulerMpc * 3.262;
    let label: string;
    if (rulerMpc >= 100) {
      label = `${rulerMpc} Мпк (${(mly).toFixed(0)} млн св. лет)`;
    } else if (rulerMpc >= 10) {
      label = `${rulerMpc} Мпк (${(mly).toFixed(0)} млн св. лет)`;
    } else {
      label = `${rulerMpc} Мпк (${(mly).toFixed(1)} млн св. лет)`;
    }

    return { pixelsPerMpc, rulerMpc, rulerPx, label };
  }, [cameraPos, cameraTarget]);

  if (rulerPx < 30 || rulerPx > 300) return null;

  return (
    <div className="pointer-events-none absolute bottom-32 left-4 z-20 sm:bottom-36 sm:left-24">
      <div className="flex items-end gap-2">
        {/* Ruler bar */}
        <div className="flex flex-col items-start">
          <div className="flex items-end gap-0">
            <div
              className="h-2 border-l-2 border-b-2 border-white/60"
              style={{ width: `${rulerPx}px` }}
            />
            <div className="h-2 border-r-2 border-b-2 border-white/60" style={{ width: 0 }} />
          </div>
          <span className="mt-1 text-[10px] font-medium text-white/70">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
