import { describe, expect, it } from "vitest";
import { canonicalSearch, readBoardQuery } from "../board";

describe("readBoardQuery", () => {
  it("accepts exactly what the app sends", () => {
    // Keep in step with src/ui/api.ts.
    const search = `?${new URLSearchParams({ crs: "WFJ", filterCrs: "EUS", numRows: "10" })}`;
    expect(readBoardQuery(search)).toEqual({ crs: "WFJ", filterCrs: "EUS", numRows: 10 });
    expect(search).toBe(`?${canonicalSearch({ crs: "WFJ", filterCrs: "EUS" })}`);
  });

  it.each([
    ["no query", ""],
    ["lowercase", "?crs=wfj&filterCrs=EUS&numRows=10"],
    ["same station twice", "?crs=WFJ&filterCrs=WFJ&numRows=10"],
    ["another row count", "?crs=WFJ&filterCrs=EUS&numRows=11"],
    ["an extra param", "?crs=WFJ&filterCrs=EUS&numRows=10&x=1"],
    ["a trailing &", "?crs=WFJ&filterCrs=EUS&numRows=10&"],
    ["another order", "?filterCrs=EUS&crs=WFJ&numRows=10"],
    ["no row count", "?crs=WFJ&filterCrs=EUS"],
    ["not a code", "?crs=WATFORD&filterCrs=EUS&numRows=10"],
  ])("rejects %s, so the edge cache can't be skipped", (_, search) => {
    expect(typeof readBoardQuery(search)).toBe("string");
  });
});
