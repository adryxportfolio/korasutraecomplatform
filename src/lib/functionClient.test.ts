import { afterEach, describe, expect, test } from "bun:test";
import { requestJson } from "./functionClient";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("requestJson", () => {
  test("aborts requests that exceed the configured timeout", async () => {
    globalThis.fetch = ((_, init) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;

    await expect(requestJson("/slow", { timeoutMs: 5 })).rejects.toThrow("Request timed out");
  });
});
