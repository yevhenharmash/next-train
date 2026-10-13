import { describe, expect, it } from "vitest";
import stations from "@/data/stations.json";
import { searchStations, shortName, type StationRow } from "../stations";

const rows = stations as unknown as StationRow[];
const names = (query: string, limit?: number) => searchStations(rows, query, limit).map((s) => s.name);

describe("station list", () => {
  it("has the stations this app started with, once each", () => {
    expect(rows.find(([crs]) => crs === "WFJ")?.[1]).toBe("Watford Junction");
    expect(rows.find(([crs]) => crs === "EUS")?.[1]).toBe("London Euston");
    expect(new Set(rows.map(([crs]) => crs)).size).toBe(rows.length);
    expect(rows.every(([crs, name]) => /^[A-Z]{3}$/.test(crs) && name.trim() !== "")).toBe(true);
  });
});

describe("searchStations", () => {
  it("finds nothing for an empty query", () => {
    expect(names("")).toEqual([]);
    expect(names("   ")).toEqual([]);
  });

  it("puts names that start with the query first, then other words", () => {
    const results = names("high", 200);
    // "Highbury & Islington" starts with it; "Watford High Street" only has a word that does.
    expect(results).toEqual(expect.arrayContaining(["Highbury & Islington", "Watford High Street"]));
    expect(results.indexOf("Highbury & Islington")).toBeLessThan(results.indexOf("Watford High Street"));
  });

  it("matches a code exactly, first", () => {
    expect(names("eus")[0]).toBe("London Euston");
    expect(names("CLJ")[0]).toBe("Clapham Junction");
    // "WAT" is Waterloo's code, so it beats the names that merely start with it.
    expect(names("wat")[0]).toBe("London Waterloo");
  });

  it("ignores case, accents and punctuation", () => {
    expect(names("harrow wealdstone")).toContain("Harrow & Wealdstone");
    expect(names("HARROW &")).toContain("Harrow & Wealdstone");
  });

  it('doesn\'t drop a query that is only "and" so far', () => {
    expect(names("and")).toContain("Andover");
    expect(names("And")[0]).toMatch(/^And/);
  });

  it("finds a station by a later word", () => {
    expect(names("euston")).toContain("London Euston");
  });

  it("limits the results", () => {
    expect(searchStations(rows, "a", 7)).toHaveLength(7);
  });
});

describe("shortName", () => {
  it("drops London from the terminals only", () => {
    expect(shortName("London Euston")).toBe("Euston");
    expect(shortName("London St Pancras International")).toBe("St Pancras International");
    expect(shortName("Clapham Junction")).toBe("Clapham Junction");
    expect(shortName("London Bridge")).toBe("London Bridge");
    expect(shortName("London Fields")).toBe("London Fields");
    expect(shortName("London Road (Brighton)")).toBe("London Road (Brighton)");
  });
});
