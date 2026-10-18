import type { ForwardedRef } from "react";

export { cn } from "@/lib/utils";

export const doodleUiFontFamily = "var(--font-body, system-ui, sans-serif)";

/** Font weights go through a function so a theme could remap them later. */
export function doodleUiFontWeight(weight: number): number {
  return weight;
}

/** Assign a value to either a callback ref or a ref object. */
export function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Derive a stable 31-bit seed from a base seed plus a string key (FNV-1a). */
export function deriveSeed(seed: number, key: string): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483647 || 1;
}
