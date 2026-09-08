"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation2, Eye } from "lucide-react";
import { REGIONS, GREAT_ATTRACTOR, MILKY_WAY } from "./data";
import { supergalacticToCartesian } from "./realGalaxies";

// Scale: same MPC_TO_SCENE as in LaniakeaScene
const MPC_TO_SCENE = 0.55;

// Pre-compute scene positions of key landmarks for the mini-map
function getLandmarks() {
  const gaPos = supergalacticToCartesian(162.0, -5.0, 62 * MPC_TO_SCENE);
  const mwPos: [number, number, number] = [-gaPos[0], -gaPos[1] * 0.5, -gaPos[2]];
  return {
    greatAttractor: { x: 0, z: 0 },
    milkyWay: { x: mwPos[0], z: mwPos[2] },
    regions: REGIONS.map((r) => ({
      key: r.key,
      name: r.name,
      color: r.color,
      x: r.position[0],
      z: r.position[2],
    })),
  };
}

interface MiniMapProps {
  cameraPos: THREE.Vector3 | null;
  cameraTarget: THREE.Vector3 | null;
  tourIndex: number;
  /** Called when user clicks a landmark on the mini-map */
  onNavigate?: (target: [number, number, number], label: string) => void;
}

/**
 * 2D top-down mini-map showing Laniakea's structure and camera position.
 * Renders a simplified projection (XZ plane = horizontal plane of the scene).
 * Landmarks are clickable — clicking flies the camera to that point.
 */
export function MiniMap({
  cameraPos,
  cameraTarget,
  tourIndex,
  onNavigate,
}: MiniMapProps) {
  const landmarks = useMemo(() => getLandmarks(), []);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const MAP_SIZE = 140;
  const SCENE_RANGE = 45;
  const scale = (MAP_SIZE / 2) / SCENE_RANGE;

  const toMapX = (sceneX: number) => MAP_SIZE / 2 + sceneX * scale;
  const toMapY = (sceneZ: number) => MAP_SIZE / 2 + sceneZ * scale;

  const tourHighlights = [
    { label: "Обзор", target: [0, 0, 0] as [number, number, number] },
    { label: "Млечный Путь", target: [landmarks.milkyWay.x, 0, landmarks.milkyWay.z] as [number, number, number] },
    { label: "Великий аттрактор", target: [0, 0, 0] as [number, number, number] },
    { label: "Гидра-Центавр", target: REGIONS[1].position as [number, number, number] },
    { label: "Павлин-Индеец", target: REGIONS[2].position as [number, number, number] },
    { label: "Южное", target: REGIONS[3].position as [number, number, number] },
    { label: "Местное", target: REGIONS[0].position as [number, number, number] },
  ];
  const currentTourTarget = tourHighlights[tourIndex] || tourHighlights[0];

  // Clickable landmark targets (regions + Great Attractor + Milky Way)
  const clickableLandmarks = [
    { key: "ga", label: "Великий аттрактор", x: 0, z: 0 },
    { key: "mw", label: "Млечный Путь", x: landmarks.milkyWay.x, z: landmarks.milkyWay.z },
    ...landmarks.regions.map((r) => ({
      key: r.key,
      label: r.name,
      x: r.x,
      z: r.z,
    })),
  ];

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold">
          <Navigation2 className="h-3.5 w-3.5 text-sky-300" />
          Мини-карта
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div
          className="relative mx-auto rounded-md border border-white/10 bg-[#02030a]"
          style={{ width: MAP_SIZE, height: MAP_SIZE }}
        >
          {/* SVG mini-map */}
          <svg
            width={MAP_SIZE}
            height={MAP_SIZE}
            viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
            className="absolute inset-0"
          >
            {/* Crosshair grid */}
            <line
              x1={MAP_SIZE / 2}
              y1={0}
              x2={MAP_SIZE / 2}
              y2={MAP_SIZE}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
            <line
              x1={0}
              y1={MAP_SIZE / 2}
              x2={MAP_SIZE}
              y2={MAP_SIZE / 2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />

            {/* Clickable landmarks (regions + GA + MW) */}
            {clickableLandmarks.map((lm) => {
              const isHovered = hoveredKey === lm.key;
              const isGA = lm.key === "ga";
              const isMW = lm.key === "mw";
              const color = isGA
                ? "#ffb347"
                : isMW
                  ? "#a8d8ff"
                  : landmarks.regions.find((r) => r.key === lm.key)?.color || "#888";
              return (
                <g key={lm.key}>
                  {/* Invisible larger click target */}
                  <circle
                    cx={toMapX(lm.x)}
                    cy={toMapY(lm.z)}
                    r={12}
                    fill="transparent"
                    style={{ cursor: onNavigate ? "pointer" : "default" }}
                    onClick={() =>
                      onNavigate?.([lm.x, 0, lm.z], lm.label)
                    }
                    onMouseEnter={() => setHoveredKey(lm.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  />
                  {/* Region circle */}
                  {!isGA && !isMW && (
                    <>
                      <circle
                        cx={toMapX(lm.x)}
                        cy={toMapY(lm.z)}
                        r={isHovered ? 10 : 8}
                        fill={color}
                        fillOpacity={isHovered ? 0.25 : 0.12}
                        stroke={color}
                        strokeWidth={0.5}
                        strokeOpacity={isHovered ? 0.8 : 0.4}
                        style={{ pointerEvents: "none", transition: "all 0.15s" }}
                      />
                      <circle
                        cx={toMapX(lm.x)}
                        cy={toMapY(lm.z)}
                        r={isHovered ? 2 : 1.5}
                        fill={color}
                        fillOpacity={0.8}
                        style={{ pointerEvents: "none", transition: "all 0.15s" }}
                      />
                    </>
                  )}
                  {/* Great Attractor */}
                  {isGA && (
                    <circle
                      cx={toMapX(lm.x)}
                      cy={toMapY(lm.z)}
                      r={isHovered ? 5 : 4}
                      fill={color}
                      fillOpacity={0.9}
                      style={{ pointerEvents: "none", transition: "all 0.15s" }}
                    >
                      <animate
                        attributeName="r"
                        values="3;5;3"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {/* Milky Way */}
                  {isMW && (
                    <circle
                      cx={toMapX(lm.x)}
                      cy={toMapY(lm.z)}
                      r={isHovered ? 3 : 2.5}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{ pointerEvents: "none", transition: "all 0.15s" }}
                    />
                  )}
                </g>
              );
            })}

            {/* Hover tooltip */}
            {hoveredKey && (
              <g style={{ pointerEvents: "none" }}>
                {(() => {
                  const lm = clickableLandmarks.find(
                    (l) => l.key === hoveredKey,
                  );
                  if (!lm) return null;
                  return (
                    <>
                      <rect
                        x={toMapX(lm.x) - 40}
                        y={toMapY(lm.z) - 22}
                        width={80}
                        height={14}
                        rx={3}
                        fill="rgba(0,0,0,0.85)"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={0.5}
                      />
                      <text
                        x={toMapX(lm.x)}
                        y={toMapY(lm.z) - 12}
                        textAnchor="middle"
                        fill="white"
                        fontSize={8}
                        fontWeight="600"
                      >
                        {lm.label}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* Tour target indicator */}
            {currentTourTarget && (
              <circle
                cx={toMapX(currentTourTarget.target[0])}
                cy={toMapY(currentTourTarget.target[2])}
                r={10}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={1}
                strokeOpacity={0.6}
                strokeDasharray="2 2"
              >
                <animate
                  attributeName="r"
                  values="8;14;8"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Camera position + direction */}
            {cameraPos && cameraTarget && (
              <g>
                {/* Direction line from camera to target */}
                <line
                  x1={toMapX(cameraPos.x)}
                  y1={toMapY(cameraPos.z)}
                  x2={toMapX(cameraTarget.x)}
                  y2={toMapY(cameraTarget.z)}
                  stroke="#22d3ee"
                  strokeWidth={0.8}
                  strokeOpacity={0.5}
                />
                {/* Camera marker (triangle pointing toward target) */}
                {(() => {
                  const dx = cameraTarget.x - cameraPos.x;
                  const dz = cameraTarget.z - cameraPos.z;
                  const angle = Math.atan2(dz, dx);
                  const cx = toMapX(cameraPos.x);
                  const cy = toMapY(cameraPos.z);
                  const r = 4;
                  // Triangle pointing in direction of target
                  const tip = [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
                  const left = [cx + r * Math.cos(angle + 2.5), cy + r * Math.sin(angle + 2.5)];
                  const right = [cx + r * Math.cos(angle - 2.5), cy + r * Math.sin(angle - 2.5)];
                  return (
                    <polygon
                      points={`${tip[0]},${tip[1]} ${left[0]},${left[1]} ${right[0]},${right[1]}`}
                      fill="#22d3ee"
                      fillOpacity={0.9}
                      stroke="#ffffff"
                      strokeWidth={0.3}
                    />
                  );
                })()}
              </g>
            )}
          </svg>
        </div>
        {/* Legend below the map */}
        <div className="mt-2 space-y-0.5 text-[9px] text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Великий аттрактор</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span>Млечный Путь</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Камера (вы)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
