import { describe, expect, test } from "bun:test";
import { isAccountHistoryView } from "./accountHistoryView";

describe("isAccountHistoryView", () => {
  test("detects the signed-in order history query", () => {
    expect(isAccountHistoryView("view=history")).toBe(true);
    expect(isAccountHistoryView("?view=history")).toBe(true);
    expect(isAccountHistoryView("view=status")).toBe(false);
  });
});
