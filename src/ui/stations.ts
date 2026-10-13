import { useQuery } from "@tanstack/react-query";
import type { StationRow } from "@/core/stations";

/** The full station list, loaded the first time the picker opens (it's ~20 kB gzipped, and not needed before). */
export function useStationRows(enabled: boolean) {
  return useQuery({
    queryKey: ["stations"],
    queryFn: async () => (await import("@/data/stations.json")).default as unknown as StationRow[],
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
