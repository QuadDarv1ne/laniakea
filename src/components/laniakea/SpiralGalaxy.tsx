"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Shader-based spiral galaxy with rotating arms.
 *
 * Renders a flat disc (in the XY plane, facing +Z) with:
 *   - A logarithmic spiral arm pattern (2 or 4 arms)
 *   - A bright bulge at the center
 *   - Per-particle rotation around the galactic center
 *   - Color gradient: warm core (yellow/orange) → cooler edges (blue/white)
 *
 * The rotation is implemented entirely in the vertex shader by rotating
 * each particle's position around the center based on its radius (differential
 * rotation — inner stars rotate faster than outer, like real galaxies).
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uRotationSpeed;
  uniform float uArmCount;
  uniform float uArmTwist;
  uniform float uBulgeSize;
  uniform float uDiscSize;
  uniform float uPixelRatio;
  uniform float uDustOpacity;

  attribute float aRandom;
  attribute float aRadius;
  attribute float aArmOffset;
  attribute float aIsDust; // 0.0 = star, 1.0 = dust particle

  varying vec3 vColor;
  varying float vBrightness;
  varying float vIsDust;

  // Simple hash for pseudo-random
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    // Normalize radius [0..1] where 0 = center, 1 = edge
    float r = aRadius;

    // Differential rotation: inner rotates faster (like real galaxies)
    float angVel = uRotationSpeed / max(0.1, sqrt(r + 0.05));
    float angle = aArmOffset + uTime * angVel;

    // Dust lanes: offset dust particles slightly behind the arm
    // (in real galaxies, dust appears on the trailing edge of spiral arms)
    if (aIsDust > 0.5) {
      // Shift dust to the inner edge of the arm (slightly smaller radius)
      r *= 0.92;
      // Slight angular offset to trail behind the arm
      angle += 0.15;
    }

    // Position in the disc plane (XY)
    float radius = r * uDiscSize;
    // Dust is slightly more confined to the disc plane (thinner)
    float thickness = aIsDust > 0.5 ? 0.12 : 0.3;
    vec3 pos = vec3(
      cos(angle) * radius,
      sin(angle) * radius,
      (aRandom - 0.5) * thickness * (1.0 - r * 0.5) + (1.0 - r) * uBulgeSize * 0.3 * aRandom
    );

    // Color: warm core (yellow) → cool edges (blue-white)
    float hue = mix(0.14, 0.58, r);
    float sat = mix(0.6, 0.4, r);
    float light = mix(0.85, 0.6, r) + aRandom * 0.1;
    vec3 starColor = hsl2rgb(vec3(hue, sat, light));

    // Dust color: dark reddish-brown (interstellar dust reddens light)
    vec3 dustColor = vec3(0.15, 0.08, 0.04);

    // Brightness: brighter near center (bulge) and along arms
    float armBrightness = 1.0 - smoothstep(0.0, 0.3, abs(fract(aArmOffset * uArmCount / (2.0 * 3.14159)) - 0.5) * 2.0);
    float bulgeBrightness = exp(-r * r * 8.0) * 2.0;

    if (aIsDust > 0.5) {
      // Dust: darker, concentrated along arm inner edges
      vBrightness = armBrightness * 0.3 + 0.1;
      vColor = dustColor;
      vIsDust = 1.0;
    } else {
      // Star: bright, colorful
      vBrightness = armBrightness * 0.5 + bulgeBrightness + 0.3;
      vColor = starColor * vBrightness;
      vIsDust = 0.0;
    }

    // Project
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size: stars are bigger, dust is smaller and more numerous
    float size;
    if (aIsDust > 0.5) {
      size = (0.5 + aRandom * 0.5) * (1.0 - r * 0.3);
    } else {
      size = (1.5 + aRandom * 1.5) * (1.0 - r * 0.4);
    }
    gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uDustOpacity;
  varying vec3 vColor;
  varying float vBrightness;
  varying float vIsDust;

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float dist = length(uv);
    if (dist > 1.0) discard;

    if (vIsDust > 0.5) {
      // Dust particles: dark, subtractive effect
      // Use higher opacity in the center, fading at edges
      float alpha = exp(-dist * dist * 3.0) * uDustOpacity;
      // Dark reddish-brown color absorbs light (renders as dark overlay)
      gl_FragColor = vec4(vColor, alpha);
    } else {
      // Star particles: bright, additive
      float alpha = exp(-dist * dist * 4.0);
      vec3 finalColor = vColor * (1.0 + (1.0 - dist) * 0.5);
      gl_FragColor = vec4(finalColor, alpha * 0.9);
    }
  }
`;

export interface SpiralGalaxyProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  particleCount?: number;
  armCount?: number;
  armTwist?: number;
  discSize?: number;
  bulgeSize?: number;
  rotationSpeed?: number;
  // Tilt the galaxy disc for 3D visibility (face-on = 0, edge-on = π/2)
  tilt?: number;
  // Fraction of particles that are dust (0..1, default 0.2 = 20%)
  dustFraction?: number;
  // Opacity of dust lanes (0..1)
  dustOpacity?: number;
}

/**
 * Renders a single spiral galaxy as a particle system with shader-based
 * rotating arms and dust lanes. Place inside a <group> with a tilt to see
 * the spiral pattern.
 */
export function SpiralGalaxy({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  particleCount = 3000,
  armCount = 2,
  armTwist = 2.5,
  discSize = 1.5,
  bulgeSize = 0.3,
  rotationSpeed = 0.15,
  tilt = 0.3,
  dustFraction = 0.2,
  dustOpacity = 0.6,
}: SpiralGalaxyProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const radii = new Float32Array(particleCount);
    const armOffsets = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount);
    const isDust = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Radius: bias toward center (power distribution)
      const r = Math.pow(Math.random(), 0.6);
      radii[i] = r;

      // Arm offset: logarithmic spiral
      const armIndex = Math.floor(Math.random() * armCount);
      const baseAngle = (armIndex / armCount) * Math.PI * 2;
      const twist = armTwist * Math.log(r + 0.1);
      // Dust particles have tighter scatter (sharper lanes), stars are more diffuse
      const isThisDust = Math.random() < dustFraction;
      const scatterRange = isThisDust ? 0.25 : 0.6;
      const scatter = (Math.random() - 0.5) * scatterRange * (1.0 - r * 0.5);
      armOffsets[i] = baseAngle + twist + scatter;

      randoms[i] = Math.random();
      isDust[i] = isThisDust ? 1.0 : 0.0;

      // Placeholder position (actual position computed in shader)
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    geo.setAttribute("aArmOffset", new THREE.BufferAttribute(armOffsets, 1));
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    geo.setAttribute("aIsDust", new THREE.BufferAttribute(isDust, 1));

    const u = {
      uTime: { value: 0 },
      uRotationSpeed: { value: rotationSpeed },
      uArmCount: { value: armCount },
      uArmTwist: { value: armTwist },
      uBulgeSize: { value: bulgeSize },
      uDiscSize: { value: discSize },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1,
      },
      uDustOpacity: { value: dustOpacity },
    };

    return { geometry: geo, uniforms: u };
  }, [particleCount, armCount, armTwist, bulgeSize, discSize, rotationSpeed, dustFraction, dustOpacity]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group rotation={[tilt, 0, 0]}>
        <points geometry={geometry}>
          <shaderMaterial
            ref={materialRef}
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            // NormalBlending allows dust particles to be dark (absorbing light),
            // while stars are rendered bright with high alpha. AdditiveBlending
            // would make dust invisible (dark + anything = no change).
            blending={THREE.NormalBlending}
          />
        </points>
      </group>
    </group>
  );
}
