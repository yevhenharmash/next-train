import type { RawBoard } from "@/core/types";

export type BoardResponse = {
  raw: RawBoard;
  /** True when the dev proxy served generated demo data (no RDM_KEY). */
  demo: boolean;
};

export async function fetchBoard({ crs, filterCrs }: { crs: string; filterCrs: string }): Promise<BoardResponse> {
  const params = new URLSearchParams({ crs, filterCrs, numRows: "10" });
  const response = await fetch(`/api/board?${params}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Board request failed (${response.status})`);
  }
  return { raw: (await response.json()) as RawBoard, demo: response.headers.get("x-board-source") === "demo" };
}
