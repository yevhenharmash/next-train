import { useQuery } from "@tanstack/react-query";
import { fetchBoard } from "./api";

export function useBoard(crs: string, filterCrs: string) {
  return useQuery({
    queryKey: ["board", crs, filterCrs],
    queryFn: () => fetchBoard({ crs, filterCrs }),
    // At most once a minute per route. The boards update about that often, and every fetch spends our RDM quota.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false, // no polling in hidden tabs
    // Coming back to the tab only refetches when the board is over a minute old (staleTime), so it
    // never adds a fetch inside the minute, but you don't stare at a 10-minute-old board either.
    refetchOnWindowFocus: true,
    staleTime: 60_000,
    retry: 2,
  });
}
