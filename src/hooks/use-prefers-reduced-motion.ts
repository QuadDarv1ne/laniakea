"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

const getClientSnapshot = () =>
  typeof window !== "undefined" && window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

/**
 * Returns true when the user has requested reduced motion at the OS level.
 *
 * The 3D scene is motion-heavy (idle camera drift, pulsing markers, twinkling
 * stars, rotating galaxies), so we honour this preference by disabling the
 * non-essential animation while keeping the static content intact.
 *
 * Uses useSyncExternalStore so the server-rendered HTML matches the first
 * client render (both false), then reflects the real value after hydration.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
