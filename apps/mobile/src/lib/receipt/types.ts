export type ReceiptLineItem = {
  description: string;
  subline?: string;
  qty: number;
  unitCents: number;
  totalCents: number;
  isFee?: boolean;
  isDiscount?: boolean;
};

export type OrderReceiptData = {
  receiptCode: string;
  issuedAt: string;
  buyer: {
    name: string;
    email: string;
    phone: string;
  };
  event: {
    id: string;
    name: string;
    editionNumber: number;
    dateLine: string;
    venueName: string;
    venueAddress: string;
  };
  lineItems: ReceiptLineItem[];
  subtotalCents: number;
  discountCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  feeLabel: string;
  paymentLine: string;
};
