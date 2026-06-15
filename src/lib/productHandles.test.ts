import { describe, expect, test } from "bun:test";
import {
  buildSkuPrefixedHandle,
  slugifyHandlePart,
  withHandleCollisionSuffix,
} from "./productHandles";

describe("product handles", () => {
  test("prefixes the normalized title with the first variant SKU", () => {
    expect(buildSkuPrefixedHandle("KS-RED-34", "Red Jamdani Blouse"))
      .toBe("ks-red-34-red-jamdani-blouse");
  });

  test("normalizes punctuation and repeated separators", () => {
    expect(slugifyHandlePart("  KS / Red__34  ")).toBe("ks-red-34");
    expect(buildSkuPrefixedHandle("KS / Red__34", "Red -- Jamdani!"))
      .toBe("ks-red-34-red-jamdani");
  });

  test("requires the first variant SKU", () => {
    expect(() => buildSkuPrefixedHandle(" -- ", "Red Blouse"))
      .toThrow("A first variant SKU is required");
  });

  test("adds a deterministic compact product ID collision suffix", () => {
    expect(withHandleCollisionSuffix(
      "ks-red-red-blouse",
      "39567a55-cb73-4f4f-a910-d0c5c6ca56d0",
    )).toBe("ks-red-red-blouse-39567a55");
  });
});
