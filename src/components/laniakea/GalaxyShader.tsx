"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Custom shader material that renders galaxy points as soft round glowing dots
 * instead of hard square pixels. Each point has:
 *   - A circular falloff (gaussian-like) so edges fade smoothly
 *   - A bright core that triggers Bloom postprocessing for real glow
 *   - Diffraction spikes on large/bright points (telescope-like cross flare)
 *   - Subtle twinkle driven by uTime (per-point phase, deterministic)
 *   - Per-point size and color (via attributes)
 */

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;

  varying vec3 vColor;
  varying float vSize;
  varying float vPointSize;
  varying float vSeed;

  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform float uMinPointSize;

  void main() {
    vColor = color;
    vSize = size * uSizeScale;

    // Deterministic per-point seed from world position (no extra attribute needed)
    vSeed = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation: closer points are bigger (perspective).
    // Clamp to a minimum so distant stars shrink to a crisp pixel dot
    // instead of vanishing entirely.
    float pointSize = vSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_PointSize = max(pointSize, uMinPointSize);
    vPointSize = pointSize;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vSize;
  varying float vPointSize;
  varying float vSeed;

  uniform float uTime;
  uniform float uTwinkle;

  void main() {
    // Convert from pixel coords to [-1, 1] range centered on the point
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float dist = length(uv);

    // Discard outside the unit circle (makes the point round, not square)
    if (dist > 1.0) discard;

    // Soft radial falloff: bright core, fading edges
    // Use a combination of gaussian and power for a nice glow
    float core = exp(-dist * dist * 8.0);       // tight bright core
    float glow = pow(1.0 - dist, 2.5) * 0.6;     // soft outer glow
    float alpha = core + glow;

    // Subtle twinkle: only for small/medium points (large galaxies stay steady)
    float twinklePhase = uTime * (0.8 + vSeed * 1.4) + vSeed * 6.2831;
    float twinkle = 1.0 + sin(twinklePhase) * 0.12 * uTwinkle *
      (1.0 - smoothstep(4.0, 14.0, vPointSize));

    // Diffraction spikes on bright/large points (telescope-like cross flare)
    float spikeStrength = smoothstep(7.0, 18.0, vPointSize);
    float spike = 0.0;
    if (spikeStrength > 0.0) {
      float ax = abs(uv.x);
      float ay = abs(uv.y);
      // Horizontal + vertical spikes: narrow gaussian along one axis,
      // fading toward the point edge along the other
      float h = exp(-ay * ay * 70.0) * pow(max(0.0, 1.0 - ax), 3.0);
      float v = exp(-ax * ax * 70.0) * pow(max(0.0, 1.0 - ay), 3.0);
      spike = (h + v) * 0.6 * spikeStrength;
    }

    // Brightness boost for the center so Bloom picks it up
    float brightness = (1.0 + core * 1.5) * twinkle;

    vec3 finalColor = vColor * brightness;
    // Spikes tinted with the point color, added on top
    finalColor += vColor * spike;
    // Clamp to avoid blowing out completely white (keeps color visible)
    finalColor = min(finalColor, vec3(2.5));

    float finalAlpha = min(1.0, alpha + spike);
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export interface GalaxyShaderMaterialProps {
  sizeScale?: number;
  transparent?: boolean;
  depthWrite?: boolean;
  blending?: THREE.Blending;
  /** Twinkle amplitude (0 = off, 0.12 = subtle default) */
  twinkle?: number;
  /** Minimum on-screen point size in pixels (keeps distant stars visible) */
  minPointSize?: number;
}

export function useGalaxyShaderMaterial(
  props: GalaxyShaderMaterialProps = {},
) {
  const {
    sizeScale = 1.0,
    transparent = true,
    depthWrite = false,
    blending = THREE.AdditiveBlending,
    twinkle = 0.12,
    minPointSize = 1.5,
  } = props;

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: {
          value:
            typeof window !== "undefined"
              ? Math.min(window.devicePixelRatio, 2)
              : 1,
        },
        uSizeScale: { value: sizeScale },
        uTime: { value: 0 },
        uTwinkle: { value: twinkle },
        uMinPointSize: { value: minPointSize },
      },
      vertexShader,
      fragmentShader,
      transparent,
      depthWrite,
      depthTest: true,
      blending,
    });
    return m;
  }, [sizeScale, transparent, depthWrite, blending, twinkle, minPointSize]);

  return material;
}

/**
 * Component version of the galaxy shader material — attaches to a <points> element.
 * Advances uTime every frame so the twinkle animation runs.
 * Usage:
 *   <points>
 *     <bufferGeometry>...</bufferGeometry>
 *     <GalaxyShaderPointsMaterial sizeScale={1.0} />
 *   </points>
 */
export function GalaxyShaderPointsMaterial(
  props: GalaxyShaderMaterialProps,
) {
  const material = useGalaxyShaderMaterial(props);
  const uniformsRef = useRef(material.uniforms);

  useFrame(({ clock }) => {
    uniformsRef.current.uTime.value = clock.getElapsedTime();
  });

  return <primitive object={material} attach="material" />;
}
