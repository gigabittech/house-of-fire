/** Ticket data needed to render inline / attached ticket passes in the receipt email. */
export type ReceiptTicket = {
  code: string;
  qrData: string;
  holderName: string;
  tierName: string;
  index: number;
  total: number;
  event: {
    name: string;
    editionNumber: number;
    date: string;
    venueName: string;
    doorsOpen?: string | null;
    doorsClose?: string | null;
  };
};

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
  /** Valid tickets on the order — source for QR email attachments. */
  tickets: ReceiptTicket[];
  subtotalCents: number;
  discountCents: number;
  feeCents: number;
  taxCents: number;
  totalCents: number;
  feeLabel: string;
  paymentLine: string;
};
