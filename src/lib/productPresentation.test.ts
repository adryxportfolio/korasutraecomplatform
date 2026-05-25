import { describe, expect, test } from "bun:test";
import {
  BLOUSE_STYLING_DISCLAIMER,
  blousePieceDisplayText,
} from "./productPresentation";

describe("product presentation copy", () => {
  test("uses explicit blouse piece inclusion labels", () => {
    expect(blousePieceDisplayText(true)).toBe("Blouse Piece Included");
    expect(blousePieceDisplayText(false)).toBe("Blouse Piece Not Included");
  });

  test("keeps the styling blouse disclaimer available for every product page", () => {
    expect(BLOUSE_STYLING_DISCLAIMER).toBe(
      "Blouse shown in the picture is for styling purpose, can be bought separately.",
    );
  });
});
