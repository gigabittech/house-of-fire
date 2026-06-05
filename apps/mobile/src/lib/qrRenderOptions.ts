// Shared ticket-QR render styling — single source of truth for on-screen QRs
// and email PNG attachments. Lives in its own module (no Node-only imports) so
// client components can import it without dragging in `qr.ts`'s node:crypto.
export const QR_RENDER_OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  margin: 2,
  width: 400,
  color: { dark: '#1a1a1a', light: '#f5f0e8' },
};
