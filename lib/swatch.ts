import type { SwatchName } from "@/components/brand/proj-item";

const SWATCHES: readonly SwatchName[] = [
  "green",
  "blue",
  "pink",
  "amber",
  "violet",
  "teal",
] as const;

export function swatchFromId(id: string): SwatchName {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return SWATCHES[Math.abs(hash) % SWATCHES.length]!;
}
