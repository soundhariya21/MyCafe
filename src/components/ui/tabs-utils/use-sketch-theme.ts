import { useState } from "react";
import { useIsomorphicLayoutEffect } from "@/components/ui/tabs-utils/use-isomorphic-layout-effect";

export interface SketchTheme {
  ink: string;
  accent: string;
}

const FALLBACK: SketchTheme = { ink: "#a89f90", accent: "#e5a93b" };

function read(): SketchTheme {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: css.getPropertyValue("--text-muted").trim() || FALLBACK.ink,
    accent: css.getPropertyValue("--accent-text").trim() || FALLBACK.accent,
  };
}

/**
 * Reads ink / accent from the site's CSS variables and follows the
 * `data-theme` switch on <html>, so the sketch recolours with the theme toggle.
 */
export function useSketchTheme(override?: string): SketchTheme {
  const [theme, setTheme] = useState<SketchTheme>(FALLBACK);

  useIsomorphicLayoutEffect(() => {
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return override ? { ink: override, accent: override } : theme;
}
