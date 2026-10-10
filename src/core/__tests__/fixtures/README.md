# Fixtures

**These are synthetic.** They follow the old LDBWS schema (PLAN.md §2) because we have no RDM key yet.
In Phase 0, replace them with real responses saved with `curl` (keep the same three scenarios and file names),
then fix whatever the tests show is different.

- `evening.json`: normal evening board, Thu 2026-10-08 18:02 BST. Overground leaves first but arrives last.
- `disrupted.json`: morning, Fri 2026-10-09 08:10 BST. A cancellation, a "Delayed" with no estimate, a 15-min late train, an NRCC alert with HTML.
- `midnight.json`: late night, Fri 2026-10-09 23:48 BST. Departures and arrivals cross midnight.
