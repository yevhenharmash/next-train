# next-train: Plan (v0, nothing built yet)

> A tiny web app that answers one question: **what's the next train from Watford Junction to London, and when do I need to leave?**
>
> **Web first.** We build the web app on the same up-to-date frontend stack as our other web projects (Mossling, Kiroku; see §4). TRMNL (e-ink) is **out of scope for now**. Once the device arrives we'll either use an existing TRMNL recipe or adapt this code (see §9).

## 1. Goal

- Show the next few trains **WFJ → London Euston (EUS)**, with live expected times, platforms, delays and cancellations.
- Sort by **arrival at Euston**, not departure. A stopping Overground train that leaves first can get in later than the next fast Avanti or LNR train. This is the feature that makes the app worth having over the National Rail app.
- "Leave home by HH:MM" for each train, using a configurable walk time.
- Refresh itself while the tab is open. No accounts, no database.

## 2. What we'd ping

**Source:** National Rail **Darwin** data through the **Rail Data Marketplace (RDM)** "Live Departure Board" REST API. It's free, and it's the official replacement for the retired OpenLDBWS SOAP feed. The existing TRMNL recipe "Live UK train departures & delays" uses the same API.

### The request

```
GET https://api1.raildata.org.uk/1010-live-departure-board-dep/LDBWS/api/20220120/GetDepBoardWithDetails/WFJ
      ?numRows=10
      &filterCrs=EUS
      &filterType=to
      &timeWindow=120
Header: x-apikey: <RDM consumer key>
```

| Part | Value | Status |
|---|---|---|
| Base path `api1.raildata.org.uk/1010-live-departure-board-dep/LDBWS/api/20220120/` | — | ✅ found in search results |
| Method `GetDepBoardWithDetails` (includes calling points, so arrival times at EUS come in the same call) | — | ✅ |
| Fallback `GetDepartureBoard` (no calling points, so no arrival times) | — | ✅ |
| `numRows` (≤150), `filterCrs`, `filterType` (`to`/`from`), `timeOffset` (−120…120), `timeWindow` (0…120) | — | ✅ |
| Station CRS codes: `WFJ` = Watford Junction, `EUS` = London Euston | — | ✅ |
| Auth header is `x-apikey` | — | ⚠️ unverified ("typically") |
| CRS as a path segment (`/WFJ`) or a query param | — | ⚠️ unverified |
| Whether the free "Live Departure Board" subscription covers **WithDetails**, or it's a separate RDM product with its own key (the `1010-…-dep` product ID in the URL suggests one subscription per product) | — | ⚠️ unverified |
| Response field names (see below) | — | ⚠️ unverified, based on the old SOAP schema |
| Rate limits | — | ⚠️ unknown, so poll politely (see §4) |
| CORS | — | ⚠️ unknown, and it doesn't matter: we proxy anyway (§3) |

### The response we expect (field names taken from the old LDBWS schema)

```jsonc
{
  "generatedAt": "2026-10-10T22:41:07+01:00",
  "locationName": "Watford Junction", "crs": "WFJ",
  "filterLocationName": "London Euston", "filtercrs": "EUS",
  "nrccMessages": [{ "Value": "Disruption between … " }],     // service alerts
  "platformAvailable": true,
  "trainServices": [{
    "serviceID": "…",
    "std": "22:47",                 // scheduled departure, UK local time
    "etd": "On time",               // "On time" | "Delayed" | "Cancelled" | "22:52"
    "platform": "8",                // can be missing
    "operator": "London Northwestern Railway", "operatorCode": "LM",
    "isCancelled": false, "cancelReason": null, "delayReason": null,
    "length": 8,
    "destination": [{ "locationName": "London Euston", "crs": "EUS" }],
    "subsequentCallingPoints": [{ "callingPoint": [
      { "locationName": "London Euston", "crs": "EUS", "st": "23:05", "et": "On time" }
    ]}]
  }]
}
```

### Phase 0: settle every ⚠️ before writing code (~15 min)

1. Register at **raildata.org.uk** and subscribe to the free **Live Departure Board** product. If "with details" is listed as a separate product, subscribe to that too. Copy the consumer key.
2. Run:
   ```sh
   curl -s -H "x-apikey: $RDM_KEY" \
     "https://api1.raildata.org.uk/1010-live-departure-board-dep/LDBWS/api/20220120/GetDepBoardWithDetails/WFJ?numRows=10&filterCrs=EUS&filterType=to&timeWindow=120" \
     | tee src/core/__tests__/fixtures/wfj-eus.json | jq '.trainServices[0]'
   ```
   If that fails, try the CRS as `?crs=WFJ`, try the plain `GetDepartureBoard`, and check the header name on the RDM product page.
3. Save **3 fixtures**: a normal evening, a board with a delay or cancellation, and a late-night board that crosses midnight. These become the test data.
4. Update this table and replace the ⚠️ marks.

## 3. Architecture

```
Browser (React)  ──fetch /api/board──▶  proxy (adds x-apikey)  ──▶  RDM API
       ▲                                     │
       └──── react-query polls every 60s ◀───┘ (proxy caches for 30s)
```

- **The key never reaches the browser.** In Vite, any `VITE_*` env variable is **bundled into the client JS**, so the key goes in `RDM_KEY` (no `VITE_` prefix) and is only read server-side.
  - **Dev:** Vite `server.proxy` sends `/api/board` to RDM and adds the header in `configure` → `proxyReq.setHeader('x-apikey', process.env.RDM_KEY)`.
  - **Deployed:** a ~30-line **Vercel function** (`api/board.ts`) next to the static build, on Vercel like inter-fast and TraceRep. It's locked to one upstream path with allow-listed params (`crs`, `filterCrs`, `numRows`), not an open pass-through, and caches responses for 30s (`Cache-Control: s-maxage=30`).

## 4. Stack and layout

The newest frontend stack across our web projects: the toolchain from **Mossling** (our most recent personal web app), the UI layer and tooling from **Kiroku** (`frontend/apps/admin-dashboard` is the newest Kiroku app), and the data layer from **inter-fast** and Kiroku.

> Versions are what the repos had on **2026-10-10**. Re-check them against npm when scaffolding (`pnpm create vite`, `pnpm dlx shadcn@latest init`).

| Area | Choice | Version seen | Taken from |
|---|---|---|---|
| Build / dev server | Vite | 8.x | Mossling, Kiroku |
| UI | React + `@vitejs/plugin-react` | 19.3 / 6.x | Mossling (Kiroku is still on React 18) |
| Language | TypeScript, `strict` | 7.x (⚠️ see below) | Mossling |
| Tests | vitest, run with `TZ=UTC` | 5.x | Mossling (Kiroku uses Jest, which we're not taking) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` + `tw-animate-css` | 4.2 | Kiroku |
| Components | shadcn/ui (Radix + `class-variance-authority` + `clsx` + `tailwind-merge`) | latest CLI | Kiroku (`packages/shadcn-ui`), inter-fast (RN version) |
| Icons / toasts | `lucide-react`, `sonner` | — | Kiroku |
| Server state | `@tanstack/react-query` + devtools | 5.x | inter-fast, Kiroku |
| Dates | `date-fns` | 4.x | inter-fast, Kiroku |
| Timezone | `@date-fns/tz` (`TZDate` in `Europe/London`), or plain `Intl` with no dependency | — | **new**, not used in our repos yet |
| Lint | ESLint flat config: `@eslint/js` + `typescript-eslint` + `@eslint-react/eslint-plugin` + `eslint-config-prettier` | ESLint 10 | Kiroku `tooling/eslint-config`, **copied inline** |
| Format | Prettier: `semi`, double quotes, `trailingComma: "es5"`, `printWidth: 120` | 3.x | Kiroku `.prettierrc` |
| Git hooks | husky + lint-staged (prettier on staged files) | — | Kiroku |
| Package manager | pnpm | 11.x | Kiroku |
| Imports | `@/` → `src/` alias | — | Kiroku |
| Hosting | Vercel (static build + one function) | — | inter-fast, TraceRep |

**Not taken from Kiroku:** Redux, styled-components, Jest, Firebase, React 18. Also not the private `@kiroku-code/*` packages (eslint-config, shadcn-ui): they're workspace/GitHub Packages only, so we copy the ESLint config and run `shadcn init` fresh.

⚠️ **TS 7 + typescript-eslint is unproven here.** Mossling runs TS 7 with no ESLint, and Kiroku runs ESLint on TS 5.9. Check at scaffold time. If typescript-eslint doesn't support TS 7 yet, use the newest TS line it does support.

Scripts: `dev`, `build` (`tsc --noEmit && vite build`), `typecheck`, `lint` (`eslint . && prettier --check .`), `format`, `test` (`TZ=UTC vitest run`).

```
next-train/
  CLAUDE.md                 # how to run, layout, the gotchas below
  .env.example              # RDM_KEY=   (never VITE_RDM_KEY)
  .prettierrc, eslint.config.js, components.json (shadcn)
  vite.config.ts            # react + tailwind plugins, @ alias, dev proxy, vitest config
  api/board.ts              # Vercel function: the deployed proxy (Phase 3)
  src/
    index.css               # @import "tailwindcss"; @import "tw-animate-css"; theme tokens
    lib/utils.ts            # cn() helper (shadcn)
    components/ui/          # shadcn-generated components (badge, card, alert, …)
    core/                   # pure TS: no DOM, no fetch, no Date.now(); every fn takes `now`
      types.ts              # raw RDM types + our Train type
      board.ts              # parse raw board → Train[]
      time.ts               # "HH:MM" UK-local → Date, midnight rollover, BST
      rank.ts               # sort by EUS arrival, "leave by", "fastest" badge
      __tests__/            # fixtures/*.json from Phase 0 + one test file per area
    ui/
      main.tsx              # QueryClientProvider
      api.ts                # fetchBoard(): GET /api/board → raw JSON (throws on !ok)
      hooks.ts              # useBoard(): useQuery wrapper
      format.ts             # all display strings ("in 6 min", "+4", "Plat 8")
      clock.ts              # the only place Date.now() is read (ticks every 15s)
      App.tsx, TrainRow.tsx, Alerts.tsx   # built from shadcn components + Tailwind classes
```

Same split as inter-fast's `fasting.ts` / `fasting-api.ts` / `fasting-hooks.ts` / `format.ts`. Keeping `core/` pure (no React, no fetch) is also what makes a later TRMNL version cheap (§9).

### react-query settings

```ts
useQuery({
  queryKey: ['board', 'WFJ', 'EUS'],
  queryFn: () => fetchBoard({ crs: 'WFJ', filterCrs: 'EUS' }),
  refetchInterval: 60_000,             // 1/min is plenty; the boards update about that often
  refetchIntervalInBackground: false,  // stop polling in hidden tabs
  refetchOnWindowFocus: true,          // fresh data when you look at it
  staleTime: 30_000,
  retry: 2,
})
```

- "Minutes until" re-renders from `clock.ts` every 15s **without refetching**. The time display and the polling are independent.
- **Never show an empty board for a failed load** (same rule as inter-fast). Keep the last good data with a "stale — last updated 22:41" badge, or show an error state.

## 5. Core logic (all unit-tested against the fixtures)

- `parseTime("23:05", now)` turns UK-local `HH:MM` into a Date. If the result is more than ~6h in the past, it's tomorrow; this handles midnight rollover. Use `Europe/London` explicitly, not the machine's timezone. Run tests with `TZ=UTC`, like Mossling, so they don't rely on the machine timezone.
- `expectedDeparture(t)`: `etd` = `"On time"` → `std`; `"HH:MM"` → that time; `"Delayed"` → unknown (show "Delayed", sort by `std`); `"Cancelled"` / `isCancelled` → excluded from "best train" but still listed, struck through.
- `arrivalAtEUS(t)`: find `crs === "EUS"` in `subsequentCallingPoints`, using `et` and falling back to `st`.
- `rank(trains, now, walkMins)`:
  - Drop trains you can't make (`expectedDeparture − now < walkMins`), or show them greyed out.
  - Sort by arrival at Euston.
  - Mark the first one as **Best**.
  - `leaveBy = expectedDeparture − walkMins`.

## 6. UI (first version)

- A big header: **"Next to London: 22:47 · Plat 8 · leave in 4 min"**.
- A list of rows: departure (struck through + new time if late) · arrival at EUS · journey length · operator · platform · status.
- `nrccMessages` shown as a dismissible alert strip.
- Settings in `localStorage`: walk time in minutes, destination (EUS, or CLJ for Southern).
- Mobile-first: it's mostly checked on a phone on the way out of the door. Light and dark themes via shadcn's tokens.
- Status is never colour-only: use text ("Delayed", "+4") and strikethrough as well as colour.

## 7. Phases

| # | What | Done when |
|---|---|---|
| 0 | Get the key, curl, save fixtures (§2) | All ⚠️ resolved, 3 fixtures saved |
| 1 | `src/core` + vitest | Parse, time, rank tests pass on all fixtures |
| 2 | Scaffold the §4 stack (Vite + Tailwind + shadcn + ESLint/Prettier/husky), dev proxy, react-query UI | `pnpm dev` shows live WFJ→EUS trains; `pnpm lint`, `pnpm typecheck` and `pnpm test` are clean; key not in the bundle (`grep` the `dist/` output) |
| 3 | `api/board.ts` Vercel function + deploy to Vercel | Works on your phone |
| 4 | Nice-to-haves: Southern via CLJ as a second query, return trip (EUS→WFJ) after 17:00, installable PWA | — |
| — | TRMNL: **not now**, see §9 | — |

## 8. Gotchas to put in CLAUDE.md

- `VITE_*` variables are public. The RDM key must only exist in the proxy.
- **We deliberately break one Kiroku convention.** Kiroku's `apps/AGENTS.md` says all runtime config comes from `VITE_*` via `import.meta.env`. That's fine for public config, but the RDM key is a secret. It's `RDM_KEY`, read only in `vite.config.ts` (dev proxy) and `api/board.ts` (Vercel), and never `VITE_RDM_KEY`.
- Darwin times are UK-local strings with no date. Always go through `core/time.ts`.
- `platform` is often missing until shortly before departure. Show "–", don't crash.
- `etd: "Delayed"` has no time attached.
- Watford → London trains run to **Euston**, except Southern, which goes to Clapham Junction / East Croydon. `filterCrs=EUS` hides Southern on purpose.
- Attribution: "Powered by National Rail Enquiries" / Darwin data from Rail Delivery Group. Check the RDM terms when you subscribe.

## 9. Later: TRMNL (parked until the device arrives)

Nothing in Phases 0–4 depends on this. These are notes for when the device arrives, so we don't redo the research.

**Option A: use what's already on the market.** The TRMNL recipe "Live UK train departures & delays" (https://trmnl.com/recipes/466893) already uses the same RDM API. If it can show WFJ→EUS well enough, install it and stop there.

**Option B: adapt our code.** Build a TRMNL private plugin whose "polling URL" is our `/api/board` proxy, with a Liquid template on TRMNL's side. Reuse `src/core` (parse, rank, arrival-at-Euston sorting) by having the proxy return already-ranked trains, which is the feature the recipe probably lacks. It would need:
- an e-ink layout at exactly **800×480**: black on white, big type, no colour.
- **absolute times** for the next 3–4 trains (e.g. "22:47 · Plat 8 · arr 23:05"), not "leave in 4 min".

**Refresh caveat (applies to both):** TRMNL's cloud redraws every 15 min at the fastest; 5 min needs TRMNL+ ($5/mo per device). A live countdown doesn't work at that rate. Alternative: self-host (BYOS, e.g. TRMNL's Terminus server) to set any interval for free.

Later idea from the same family: the flight-price tracker as a sibling plugin.

## Sources

- RDM endpoint path: search result quoting `api1.raildata.org.uk/1010-live-departure-board-dep/LDBWS/api/20220120/GetDepBoardWithDetails`
- Query params: harmonicdigital/ldbws README — https://packagist.org/packages/harmonicdigital/ldbws
- TRMNL recipe on the same API — https://trmnl.com/recipes/466893
- RDM is the OpenLDBWS replacement — https://wiki.openraildata.com/index.php/Rail_Data_Marketplace/Feeds
