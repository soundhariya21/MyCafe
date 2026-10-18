import { useRef, useState } from "react";
import rough from "roughjs";
import { useIsomorphicLayoutEffect } from "@/components/ui/tabs-utils/use-isomorphic-layout-effect";
import type { SketchProps } from "@/components/ui/tabs-utils/types";

const generator = rough.generator();

interface RoughSvgProps extends SketchProps {
  shape: "line";
  /** Padding between the box edge and the stroke ends. */
  inset?: number;
}

/** Fills its (positioned) parent with a hand-drawn SVG shape. */
export function RoughSvg({
  roughness = 1,
  seed = 1,
  sketchColor = "currentColor",
  bowing = 1,
  strokeWidth = 1.5,
  inset = 0,
}: RoughSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useIsomorphicLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const measure = () => setSize({ w: parent.clientWidth, h: parent.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const paths =
    size.w > 0
      ? generator.toPaths(
          generator.line(inset, size.h / 2, size.w - inset, size.h / 2, {
            roughness,
            seed,
            bowing,
            strokeWidth,
          }),
        )
      : [];

  return (
    <svg
      ref={ref}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={sketchColor}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
