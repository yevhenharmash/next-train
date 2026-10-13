# Fixtures

`live-evening.json` is a **real** RDM response: `GetDepBoardWithDetails/WFJ?filterCrs=EUS`, Tue 2026-10-13 20:20 BST.
Ten trains, all LNR and Overground, a few running late, no alerts. It confirmed the field names in `core/types.ts`.

The other three are **synthetic**, written before we had a key, for scenarios a single real board can't show.
Swap each for a real capture when one turns up (keep the file name, then fix whatever the tests show is different):

- `evening.json`: normal evening board, Thu 2026-10-08 18:02 BST. Overground leaves first but arrives last.
- `disrupted.json`: morning, Fri 2026-10-09 08:10 BST. A cancellation, a "Delayed" with no estimate, a 15-min late train, an NRCC alert with HTML.
- `midnight.json`: late night, Fri 2026-10-09 23:48 BST. Departures and arrivals cross midnight.

Still unseen in real data: the `nrccMessages` item shape (the key is absent when there are no alerts), cancellations, "Delayed", and a non-zero `length`.
