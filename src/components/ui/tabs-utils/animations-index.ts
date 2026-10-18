import { useEffect, type RefObject } from "react";

/** Duration of the pen-stroke draw-in, in ms. */
export const DRAW_IN_MARK_MS = 420;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Resolves the `animate` prop: an explicit value wins, otherwise on unless the user prefers reduced motion. */
export function useAnimate(animate?: boolean): boolean {
  return animate ?? !prefersReducedMotion();
}

/**
 * Draws every <path> inside `ref` in like a pen stroke on mount and whenever
 * `trigger` changes.
 */
export function useDrawIn(
  ref: RefObject<HTMLElement | null>,
  duration: number,
  enabled: boolean,
  trigger: unknown,
) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const paths = Array.from(el.querySelectorAll<SVGPathElement>("path"));
    const animations = paths.map((path) => {
      const length = path.getTotalLength();
      return path.animate(
        [
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDasharray: length, strokeDashoffset: 0 },
        ],
        { duration, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    });
    return () => animations.forEach((a) => a.cancel());
  }, [ref, duration, enabled, trigger]);
}
