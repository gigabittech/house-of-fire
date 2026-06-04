/** Per-ticket all-in display total (ticket price + service fee). */
export function tierAllInCents(priceCents: number, feeCents: number): number {
  return Math.max(0, priceCents) + Math.max(0, feeCents);
}

export function computeCheckoutAmounts(params: {
  priceCents: number;
  feeCents: number;
  quantity: number;
  discountCents?: number;
}): {
  subtotalCents: number;
  discountCents: number;
  discountedSubtotalCents: number;
  feeCents: number;
  totalCents: number;
} {
  const qty = Math.max(1, params.quantity);
  const subtotalCents = params.priceCents * qty;
  const discountCents = Math.min(params.discountCents ?? 0, subtotalCents);
  const discountedSubtotalCents = subtotalCents - discountCents;
  const feeCents = params.feeCents * qty;
  const totalCents = discountedSubtotalCents + feeCents;
  return {
    subtotalCents,
    discountCents,
    discountedSubtotalCents,
    feeCents,
    totalCents,
  };
}
