export type ReviewEligibility = {
  eligible: boolean;
  hasSession: boolean;
  reason?: string;
};

type ReviewFormInput = {
  customerName: string;
  rating: number;
  title: string;
  content: string;
};

export function getReviewGateMessage(eligibility: ReviewEligibility) {
  if (eligibility.eligible) return "";
  if (eligibility.hasSession && eligibility.reason) return eligibility.reason;
  return "Only verified purchase customers can write a review. Please complete checkout with WhatsApp OTP first.";
}

export function normalizeReviewForm(input: ReviewFormInput) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 1)));
  const title = input.title.trim();

  return {
    customerName: input.customerName.trim(),
    rating,
    title: title || null,
    content: input.content.trim(),
  };
}
