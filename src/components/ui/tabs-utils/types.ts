import type { Options } from "roughjs/bin/core";

/** Sketch options shared by every hand-drawn part. */
export interface SketchProps {
  /** Wobble of the stroke. Higher = messier. */
  roughness?: number;
  /** Fixed seed so the drawing is stable between renders. */
  seed?: number;
  /** Overrides the theme ink / accent colour. */
  sketchColor?: string;
  /** How much lines bow away from straight. */
  bowing?: number;
  fillStyle?: Options["fillStyle"];
  strokeWidth?: number;
}
