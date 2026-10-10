import { useQuery } from "@tanstack/react-query";
import { fetchBoard } from "./api";

export function useBoard(crs: string, filterCrs: string) {
  return useQuery({
    queryKey: ["board", crs, filterCrs],
    queryFn: () => fetchBoard({ crs, filterCrs }),
    refetchInterval: 60_000, // the boards update about once a minute
    refetchIntervalInBackground: false, // no polling in hidden tabs
    refetchOnWindowFocus: true,
    staleTime: 30_000,
    retry: 2,
  });
}
