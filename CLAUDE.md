# next-train

Web app: next trains from Watford Junction to London Euston, sorted by **arrival** time, with "leave by" times based on your walk. Plan, API notes and open questions: [PLAN.md](PLAN.md). Similar apps and how we differ: [COMPETITORS.md](COMPETITORS.md).

```sh
pnpm install
pnpm dev         # http://localhost:5173. Without RDM_KEY in .env, /api/board serves generated demo data
pnpm test        # TZ=UTC vitest run
pnpm typecheck
pnpm lint        # eslint + prettier --check (pnpm format to fix)
pnpm build       # typecheck + production build into dist/
```

## Stack

Vite 8, React 19, TypeScript 6 (**not 7**: typescript-eslint doesn't support it yet), Tailwind 4 + shadcn/ui (new-york, neutral), TanStack Query 5, date-fns 4 + `@date-fns/tz`, vitest, ESLint flat config + Prettier (Kiroku settings), husky + lint-staged, pnpm. Deployed on Vercel.

## Layout

- `src/core/`: pure TypeScript. No DOM, no fetch, no `Date.now()`; every function takes `now`.
  - `types.ts`: raw RDM types and our `Train`/`RankedTrain`.
  - `time.ts`: UK-local "HH:MM" → Date, with midnight rollover.
  - `board.ts`: raw board → `Train[]`.
  - `rank.ts`: sort by arrival, pick the best train, compute leave-by times.
- `src/core/__tests__/`: one test file per area, plus `fixtures/` (synthetic for now; see the README there).
- `src/ui/`: React.
  - `clock.ts` is the only place the real clock is read.
  - `api.ts` → `hooks.ts` (useQuery) → components.
  - `format.ts` holds every display string.
  - `settings.ts` stores walk time and destination in localStorage.
  - `theme.ts` + `ThemeToggle.tsx`: System / Light / Dark. It sets a `dark` class on `<html>`; an inline script in `index.html` applies the same logic before first paint. Change both together.
- `src/components/ui/`: shadcn-generated components. Add more with `pnpm dlx shadcn@latest add <name>`, then check the import is `@/lib/utils`. Once, it was generated as `from "cn"` and installed a random npm package called `cn`.
- `server/board.ts`: the `/api/board` proxy handler, shared by dev and prod. It allow-lists params, adds the key, and caches for 30s at the edge.
- `server/demo.ts`: dev-only demo board.
- `api/board.ts`: Vercel function wrapping `server/board.ts`. Import with a `.js` extension there; Vercel runs it as Node ESM.
- `vite.config.ts`: serves `/api/board` in dev through the same handler.

## Gotchas

- **The RDM key is `RDM_KEY`, never `VITE_RDM_KEY`.** `VITE_*` variables are bundled into the client. This deliberately breaks Kiroku's "all config via `VITE_*`" rule; that rule is for public config. Only `vite.config.ts` and `api/board.ts` read the key. After a build, check with `grep -ri raildata dist`.
- Darwin times are UK-local "HH:MM" strings with no date. Always go through `core/time.ts`, and format with `ui/format.ts` (UK timezone), never `toLocaleTimeString()`.
- `etd` can be "On time", "Delayed" (no time), "Cancelled" or "HH:MM". `platform` is often missing until shortly before departure.
- Never show an empty board for a failed load. Keep the last good data and say it's stale.
- The RDM field names are still unverified (PLAN.md §2, Phase 0). When real responses arrive, replace the fixtures and fix `core/types.ts` and `board.ts`.
- Attribution "Powered by National Rail Enquiries" stays in the footer.
