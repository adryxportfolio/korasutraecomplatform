import { describe, expect, test } from "bun:test";
import {
  koraSutraFaviconUrl,
  koraSutraLogoUrl,
  koraSutraStructuredDataLogoUrl,
} from "./brandAssets";

describe("brand assets", () => {
  test("uses shared website and structured-data logo paths", () => {
    expect(koraSutraLogoUrl).toBe("/logo.png");
    expect(koraSutraFaviconUrl).toBe("/favicon.png");
    expect(koraSutraStructuredDataLogoUrl).toBe("https://korasutra.com/logo.png");
  });
});
