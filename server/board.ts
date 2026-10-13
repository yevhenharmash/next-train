// The /api/board proxy, shared by the Vite dev server (vite.config.ts) and Vercel (api/board.ts).
// It adds the RDM key server-side, so the key never reaches the browser. It only ever calls one
// upstream method, with allow-listed params: it is not an open pass-through.
// Self-contained on purpose (no runtime imports) so Vercel can bundle it without path tricks.

// The product route differs between subscriptions ("-dep" on older ones, "-dep1_2" on newer ones):
// copy the exact base URL from your subscription's API tab into RDM_BASE_URL if it isn't this one.
export const DEFAULT_BASE_URL = "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120";
const CRS = /^[A-Z]{3}$/;
const CACHE_SECONDS = 30;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export type BoardQuery = { crs: string; filterCrs: string; numRows: number };

const ROWS = 10;

/**
 * Validates the query string. Returns an error message for anything outside the allow-list.
 * Only the exact form the app sends is accepted (`?crs=WFJ&filterCrs=EUS&numRows=10`): the edge cache
 * keys on the whole URL, so `?crs=wfj`, an extra `&x=1` or another row count would each skip it
 * and spend a request of our RDM quota.
 */
export function readBoardQuery(search: string): BoardQuery | string {
  const params = new URLSearchParams(search);
  const crs = params.get("crs") ?? "";
  const filterCrs = params.get("filterCrs") ?? "";
  if (!CRS.test(crs)) return "crs must be a 3-letter station code in capitals";
  if (!CRS.test(filterCrs)) return "filterCrs must be a 3-letter station code in capitals";
  if (crs === filterCrs) return "crs and filterCrs must be different stations";
  const query = { crs, filterCrs, numRows: ROWS };
  if (search !== `?${canonicalSearch(query)}`) return `Use exactly ?${canonicalSearch(query)}`;
  return query;
}

/** The one query string the proxy accepts for a route. `src/ui/api.ts` sends exactly this. */
export function canonicalSearch({ crs, filterCrs }: Pick<BoardQuery, "crs" | "filterCrs">): string {
  return new URLSearchParams({ crs, filterCrs, numRows: String(ROWS) }).toString();
}

export function upstreamUrl({ crs, filterCrs, numRows }: BoardQuery, baseUrl = DEFAULT_BASE_URL): string {
  const params = new URLSearchParams({
    numRows: String(numRows),
    filterCrs,
    filterType: "to",
    timeWindow: "120",
  });
  return `${baseUrl.replace(/\/$/, "")}/GetDepBoardWithDetails/${crs}?${params}`;
}

export type BoardConfig = { apiKey: string | undefined; baseUrl?: string };

export async function handleBoardRequest(url: URL, { apiKey, baseUrl }: BoardConfig): Promise<Response> {
  const query = readBoardQuery(url.search);
  if (typeof query === "string") return json(400, { error: query });
  if (!apiKey) return json(500, { error: "RDM_KEY is not configured on the server" });

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl(query, baseUrl || DEFAULT_BASE_URL), {
      headers: { "x-apikey": apiKey, accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    return json(502, { error: `Couldn't reach National Rail: ${error instanceof Error ? error.message : error}` });
  }
  // Don't pass upstream error bodies through: they may echo request details.
  if (!upstream.ok) return json(502, { error: `National Rail returned ${upstream.status}` });

  return new Response(await upstream.text(), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Browsers always revalidate; the Vercel edge cache serves everyone the same board for 30s.
      "cache-control": `public, max-age=0, s-maxage=${CACHE_SECONDS}`,
    },
  });
}
