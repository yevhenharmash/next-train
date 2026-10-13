# Traincommute

Renamed from next-train on 2026-10-13. The repo, folder and localStorage keys (`next-train:settings`, `next-train:theme`) keep the old name on purpose: changing the keys would reset everyone's saved route.

Web app: next trains between any two stations (default Watford Junction → London Euston), sorted by **arrival** time, with "leave by" times based on your walk. Plan, API notes and open questions: [PLAN.md](PLAN.md). Similar apps and how we differ: [COMPETITORS.md](COMPETITORS.md).

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
  - `stations.ts`: station search (code, then name prefix, word prefix, substring).
- `src/core/__tests__/`: one test file per area, plus `fixtures/` (one real board, three synthetic scenarios; see the README there).
- `src/ui/`: React.
  - `clock.ts` is the only place the real clock is read.
  - `api.ts` → `hooks.ts` (useQuery) → components.
  - `format.ts` holds every display string. `Status.tsx` is the status pill (words plus colour, never colour alone).
  - `settings.ts`: route (from/to), walk time per departure station, recent stations; localStorage, with a migration from the first version's `{ walkMinutes, destination }`.
  - `RouteCard.tsx` (A ⇄ B), `StationPicker.tsx` (bottom sheet, Radix Dialog), `WalkRow.tsx`.
  - `theme.ts` + `ThemeToggle.tsx`: System / Light / Dark. It sets a `dark` class on `<html>`; an inline script in `index.html` applies the same logic before first paint. Change both together.
- Design: [route picker canvas](https://claude.ai/artifact/4PEEb54EMdby8LPXDEMzPv) (current: A ⇄ B, station picker, swapped), built on the [first canvas](https://claude.ai/artifact/S7ZSkiHgMk3FEnXsxBL2Zz) (evening, disrupted, night). Its colours are the tokens in `src/index.css`. The "next train" card (`--hero`) stays dark in both themes, and the leave time is amber. Font: Geist, loaded from Google Fonts in `index.html`.
- Link previews: Open Graph tags in `index.html` point at `public/og.png` (1200×630), a screenshot of `scripts/og.html`. The command is in that file. Re-shoot it when the design or name changes.
- `src/data/stations.json`: all 2,609 Darwin stations as `[crs, name]`, loaded only when the picker opens. **ODbL**: keep the footer credit; see `src/data/README.md`.
- `src/components/ui/`: shadcn-generated components. Add more with `pnpm dlx shadcn@latest add <name>`, then check the import is `@/lib/utils`. Once, it was generated as `from "cn"` and installed a random npm package called `cn`.
- `server/board.ts`: the `/api/board` proxy handler, shared by dev and prod. It only accepts the exact query `src/ui/api.ts` sends (`?crs=WFJ&filterCrs=EUS&numRows=10`, any two different stations), so variations can't skip the 30s edge cache. Change both together. Tests in `server/__tests__/`.
- `server/demo.ts`: dev-only demo board (Watford Junction → Euston only; other routes come back empty).
- `api/board.ts`: Vercel function wrapping `server/board.ts`. Import with a `.js` extension there; Vercel runs it as Node ESM.
- `vite.config.ts`: serves `/api/board` in dev through the same handler.

## Gotchas

- **The RDM key is `RDM_KEY`, never `VITE_RDM_KEY`.** `VITE_*` variables are bundled into the client. This deliberately breaks Kiroku's "all config via `VITE_*`" rule; that rule is for public config. Only `vite.config.ts` and `api/board.ts` read the key. After a build, check with `grep -ri raildata dist`.
- Darwin times are UK-local "HH:MM" strings with no date. Always go through `core/time.ts`, and format with `ui/format.ts` (UK timezone), never `toLocaleTimeString()`.
- `etd` can be "On time", "Delayed" (no time), "Cancelled" or "HH:MM". `platform` is often missing until shortly before departure.
- Never show an empty board for a failed load. Keep the last good data and say it's stale.
- The RDM field names are verified against real boards, including a cancellation and an alert (`fixtures/live-*.json`). Not yet seen live: "Delayed" with no estimate, a cancelled destination stop. When you see one, save it as a fixture.
- `length` (coaches) is 0 on every real service seen so far, so `coaches` is usually null.
- Attribution "Powered by National Rail Enquiries" stays in the footer.
