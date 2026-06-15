import { describe, expect, test } from "bun:test";
import { resolveProductHandle } from "./productHandleResolution";

describe("product handle resolution", () => {
  test("returns a current product without redirect lookup", async () => {
    let redirectLookups = 0;
    const result = await resolveProductHandle("current-handle", {
      loadCurrent: async () => ({ handle: "current-handle", title: "Current" }),
      loadRedirect: async () => {
        redirectLookups += 1;
        return null;
      },
    });

    expect(result).toEqual({
      product: { handle: "current-handle", title: "Current" },
      canonicalHandle: "current-handle",
    });
    expect(redirectLookups).toBe(0);
  });

  test("resolves an old handle to its current canonical product", async () => {
    const result = await resolveProductHandle("old-handle", {
      loadCurrent: async (handle) => (
        handle === "new-handle" ? { handle: "new-handle", title: "Current" } : null
      ),
      loadRedirect: async () => "new-handle",
    });

    expect(result).toEqual({
      product: { handle: "new-handle", title: "Current" },
      canonicalHandle: "new-handle",
    });
  });
});
