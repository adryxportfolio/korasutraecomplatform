import { describe, expect, test } from "bun:test";
import { getReviewGateMessage, normalizeReviewForm } from "./productReviews";

describe("product review helpers", () => {
  test("explains that review writing requires a verified purchase session", () => {
    expect(getReviewGateMessage({ eligible: false, hasSession: false })).toBe(
      "Only verified purchase customers can write a review. Please complete checkout with WhatsApp OTP first.",
    );
  });

  test("uses server-provided ineligibility reasons for signed-in customers", () => {
    expect(getReviewGateMessage({ eligible: false, hasSession: true, reason: "Purchase this product before reviewing it." })).toBe(
      "Purchase this product before reviewing it.",
    );
  });

  test("normalizes review form input before submission", () => {
    expect(normalizeReviewForm({
      customerName: "  Ananya  ",
      rating: 7,
      title: "   ",
      content: "  Beautiful drape and finish.  ",
    })).toEqual({
      customerName: "Ananya",
      rating: 5,
      title: null,
      content: "Beautiful drape and finish.",
    });
  });
});
