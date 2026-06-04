import { renderToBuffer } from '@react-pdf/renderer';
import { loadReceiptLogoDataUri } from './receiptLogo';
import { getReceiptPdfDocument } from './receiptPdf';
import type { OrderReceiptData } from './types';

export async function renderReceiptPdf(data: OrderReceiptData): Promise<Buffer> {
  const logoSrc = await loadReceiptLogoDataUri();
  const doc = getReceiptPdfDocument(data, logoSrc);
  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
