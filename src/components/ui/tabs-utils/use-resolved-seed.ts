import { useId } from "react";
import { deriveSeed } from "@/components/ui/tabs-utils/utils";

/** Returns the given seed, or one derived from the component's React id so it stays stable. */
export function useResolvedSeed(seed?: number): number {
  const id = useId();
  return seed ?? deriveSeed(7, id);
}
