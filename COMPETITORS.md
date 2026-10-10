# Competitors

Researched on 2026-10-10. Ratings and prices change, so re-check before relying on them.

Our main idea is to pick the train that **arrives** first, not the one that leaves first. At least two apps already do that, and a long-running website covers most of the rest.

## Closest matches

|                                                                                                                                                           | What it does                                                                                                                                                                                                                                                | Platforms           | Price         | How popular                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| **[nxTrain – Win the commute](https://apps.apple.com/gb/app/id6760363268)** by Marc Wickens ([announcement](https://www.imarc.co.uk/2026/05/23/nxtrain/)) | Our idea almost exactly: "services ordered by earliest arrival time". Switches between morning and evening journeys automatically, supports multiple commutes, and alerts you when your line has lots of delays. Direct trains only. **No walk time.**      | iPhone, Apple Watch | £2.99 one-off | Very small: **5.0★ from 2 ratings** (UK store). v1.0 March 2026, v2.0 October 2026, so actively developed.        |
| **[Railtime – UK Train Times](https://apps.apple.com/gb/app/railtime-uk-train-times/id6748611786)** by Jason Quach                                        | Departure boards that "highlight the next fastest service". Widgets that flip direction after midday, with a retro dot-matrix theme. **No walk time** mentioned. Plans a paid "supporter" tier.                                                             | iPhone, iPad, Mac   | Free, no ads  | Small: **4.7★ from 51 ratings** (UK store), 1 rating in the US. Released January 2026, updated every month or so. |
| **[traintimes.org.uk](https://traintimes.org.uk/WFJ/EUS)** by Matthew Somerville                                                                          | Plain website: next trains from Watford Junction to Euston with live delays, platforms, journey times, fares, and replacement buses. Sorted by **departure**, not arrival. Has a **Donate** link, a working example of our "say thanks" idea (PLAN.md §4b). | Any browser         | Free          | Long-running and well known among rail enthusiasts. **Our take: the UI is ugly and dated.**                       |

**On "how popular":** app stores don't publish download numbers. A common rule of thumb is that 1–2% of users leave a rating. That would put Railtime at a few thousand users and nxTrain at a few hundred at most. Treat these as rough guesses, not data. Both are indie apps, and neither dominates.

## General-purpose apps

**Citymapper**, **Google Maps**, **Trainline** (has a next-train widget) and the official **National Rail** app all plan journeys and can tell you when to leave. They're built for planning any trip and buying tickets, not one repeated commute, so they take more taps.

## Where we're different

The edge is thin, especially against nxTrain for iPhone users:

- **Any phone, no install.** It's a web page, so Android users and people who won't install an app are covered. nxTrain and Railtime are Apple-only.
- **Walk-time countdown** ("Leave in 4 min"). Neither app mentions it.
- **Honest about delays with no estimate.** A train marked "Delayed" with no new time is never picked as Best; the headline mentions it instead.
- **A nicer UI than traintimes.org.uk**, which is the only other no-install option.
- **Feeds a TRMNL e-ink screen later** (PLAN.md §9).

Before investing more, try nxTrain (£2.99) for a few days and see whether ours still adds something.

## Ideas taken from them

- **Replacement buses.** traintimes.org.uk showed a 00:40 replacement bus on 2026-10-10. Darwin lists buses separately from trains (`busServices`), and we currently ignore them. Add them once we have real data: they matter exactly on disruption nights.
- **Auto-reverse after midday** (Railtime, nxTrain): show the return trip, Euston → Watford Junction, in the evening. It's already a Phase 4 idea in PLAN.md.
- **Delay alerts** (nxTrain): a notification when your line has lots of delays. That needs push notifications, so it would come after the app becomes an installable PWA.
