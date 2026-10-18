"use client";

import { useBaseRoughness } from "@/components/ui/tabs-utils/use-sketch-defaults";
import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  DRAW_IN_MARK_MS,
  useAnimate,
  useDrawIn,
} from "@/components/ui/tabs-utils/animations-index";
import { useIsomorphicLayoutEffect } from "@/components/ui/tabs-utils/use-isomorphic-layout-effect";
import { useResolvedSeed } from "@/components/ui/tabs-utils/use-resolved-seed";
import { useSketchTheme } from "@/components/ui/tabs-utils/use-sketch-theme";
import { RoughSvg } from "@/components/ui/tabs-utils/rough-svg";
import type { SketchProps } from "@/components/ui/tabs-utils/types";
import {
  assignRef,
  cn,
  deriveSeed,
  doodleUiFontFamily,
  doodleUiFontWeight,
} from "@/components/ui/tabs-utils/utils";

interface TabsSketchContextValue extends SketchProps {
  resolvedSeed: number;
  ink: string;
  accent: string;
  current: string | undefined;
  shouldAnimate: boolean;
}

const TabsSketchContext = createContext<TabsSketchContextValue | null>(null);

function useTabsSketch(): TabsSketchContextValue {
  const ctx = useContext(TabsSketchContext);
  if (!ctx) {
    throw new Error("Tab parts must be used inside <Tabs>.");
  }
  return ctx;
}

/**
 * Props for {@link Tabs}.
 */
export interface TabsProps
  extends
    Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "asChild">,
    SketchProps {
  /**
   * Draw-in the active underline and slide it on tab change.
   * Defaults to the DoodleUIProvider value (true).
   */
  /**
   * Play sketch draw-in animations. Defaults to {@link DoodleUIProvider} `animate` (true).
   * @default undefined (follow provider)
   */
  animate?: boolean;
}

/**
 * Tab list with animated sketch underline.
 *
 * @example
 * <Tabs />
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    className,
    style,
    children,
    value,
    defaultValue,
    onValueChange,
    roughness,
    seed,
    sketchColor,
    bowing,
    fillStyle,
    strokeWidth,
    animate,
    ...rest
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const resolvedSeed = useResolvedSeed(seed);
  const theme = useSketchTheme(sketchColor);
  const ink = sketchColor ?? theme.ink;
  const accent = sketchColor ?? theme.accent;
  const shouldAnimate = useAnimate(animate);
  const isControlled = value !== undefined;
  const rootValueProps = isControlled ? { value: current } : { defaultValue };

  return (
    <TabsSketchContext.Provider
      value={{
        roughness,
        seed: resolvedSeed,
        sketchColor,
        bowing,
        fillStyle,
        strokeWidth,
        resolvedSeed,
        ink,
        accent,
        current,
        shouldAnimate,
      }}
    >
      <TabsPrimitive.Root
        ref={ref}
        className={cn(className)}
        style={style}
        {...rootValueProps}
        onValueChange={(next) => {
          setUncontrolled(next);
          onValueChange?.(next);
        }}
        {...rest}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsSketchContext.Provider>
  );
});

/**
 * Props for {@link TabList}.
 */
export interface TabListProps extends Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  "asChild"
> {}

interface UnderlineBox {
  left: number;
  top: number;
  width: number;
}

function TabUnderline({
  box,
  seed,
  sketch,
}: {
  box: UnderlineBox;
  seed: number;
  sketch: TabsSketchContextValue;
}) {
  const baseRoughness = useBaseRoughness();
  const ref = useRef<HTMLSpanElement>(null);
  useDrawIn(ref, DRAW_IN_MARK_MS, sketch.shouldAnimate, seed);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: 10,
        pointerEvents: "none",
        transition: sketch.shouldAnimate
          ? "left 220ms ease, width 220ms ease, top 220ms ease"
          : undefined,
      }}
    >
      <RoughSvg
        shape="line"
        roughness={(sketch.roughness ?? baseRoughness) + 0.35}
        seed={seed}
        sketchColor={sketch.accent}
        bowing={sketch.bowing ?? 1.8}
        strokeWidth={(sketch.strokeWidth ?? 1.75) + 0.4}
        inset={2}
      />
    </span>
  );
}

export const TabList = forwardRef<HTMLDivElement, TabListProps>(
  function TabList({ className, style, children, ...rest }, ref) {
    const sketch = useTabsSketch();
    const listRef = useRef<HTMLDivElement>(null);
    const [underline, setUnderline] = useState<UnderlineBox | null>(null);

    useIsomorphicLayoutEffect(() => {
      const list = listRef.current;
      if (!list) return;

      const measure = () => {
        const active = list.querySelector<HTMLElement>('[data-state="active"]');
        if (!active) {
          setUnderline(null);
          return;
        }
        setUnderline({
          left: active.offsetLeft + 8,
          top: active.offsetTop + active.offsetHeight - 10,
          width: Math.max(12, active.offsetWidth - 16),
        });
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(list);
      return () => observer.disconnect();
    }, [sketch.current, children]);

    return (
      <TabsPrimitive.List
        ref={(node) => {
          (listRef as MutableRefObject<HTMLDivElement | null>).current = node;
          assignRef(ref, node);
        }}
        className={cn(className)}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          position: "relative",
          ...style,
        }}
        {...rest}
      >
        {children}
        {underline && sketch.current ? (
          <TabUnderline
            box={underline}
            seed={deriveSeed(sketch.resolvedSeed, sketch.current)}
            sketch={sketch}
          />
        ) : null}
      </TabsPrimitive.List>
    );
  },
);

/**
 * Props for {@link Tab}.
 */
export interface TabProps extends Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  "asChild"
> {
  children?: ReactNode;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { className, style, children, value, ...rest },
  ref,
) {
  const sketch = useTabsSketch();
  const active = sketch.current === value;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(className)}
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "8px 14px 12px",
        fontFamily: doodleUiFontFamily,
        fontSize: 15,
        fontWeight: active ? doodleUiFontWeight(650) : doodleUiFontWeight(400),
        color: active ? sketch.accent : sketch.ink,
        outline: "none",
        ...style,
      }}
      {...rest}
    >
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </TabsPrimitive.Trigger>
  );
});

/**
 * Props for {@link TabPanel}.
 */
export interface TabPanelProps extends Omit<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
  "asChild"
> {}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel({ className, style, children, ...rest }, ref) {
    const sketch = useTabsSketch();
    return (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(className)}
        style={{
          paddingTop: 14,
          fontFamily: doodleUiFontFamily,
          color: sketch.ink,
          fontSize: 15,
          lineHeight: 1.5,
          outline: "none",
          ...style,
        }}
        {...rest}
      >
        {children}
      </TabsPrimitive.Content>
    );
  },
);

export default Tabs;
