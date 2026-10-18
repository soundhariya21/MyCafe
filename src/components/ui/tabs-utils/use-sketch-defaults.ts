/** Base wobble used when a part does not set its own `roughness`. */
export const DEFAULT_ROUGHNESS = 1.2;

export function useBaseRoughness(): number {
  return DEFAULT_ROUGHNESS;
}
