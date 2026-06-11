'use client';

import { formatIssuedDate, formatReceiptCents } from '@/lib/receipt/format';
import type { OrderReceiptData } from '@/lib/receipt/types';

type OrderReceiptProps = {
  data: OrderReceiptData;
  /** When true, wraps content for print-only target (#hof-receipt-print). */
  printTarget?: boolean;
};

export function OrderReceipt({ data, printTarget = false }: OrderReceiptProps) {
  const footerSubtotal = data.subtotalCents - data.discountCents + data.feeCents;

  const page = (
    <div
      id={printTarget ? 'hof-receipt-print' : undefined}
      style={{
        width: '100%',
        maxWidth: 612,
        margin: '0 auto',
        background: '#fff',
        color: '#111',
        fontFamily: 'Inter, Helvetica, sans-serif',
        padding: '48px 56px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        minHeight: printTarget ? undefined : 720,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingBottom: 18,
          borderBottom: '2px solid #111',
        }}
      >
        <div>
          <img
            src="/assets/hof-logo-black.png"
            alt="House of Fire"
            style={{ height: 28, width: 'auto', display: 'block' }}
          />
          <div
            style={{
              fontSize: 10,
              color: '#666',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginTop: 8,
            }}
          >
            houseoffire.events · Boulder, CO
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 10,
              color: '#666',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Receipt
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14,
              fontWeight: 600,
              color: '#111',
              marginTop: 4,
              letterSpacing: '0.12em',
            }}
          >
            {data.receiptCode}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            Issued {formatIssuedDate(data.issuedAt)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          marginTop: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#666',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Buyer
          </div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: '#111' }}>
            <div style={{ fontWeight: 600 }}>{data.buyer.name}</div>
            <div>{data.buyer.email}</div>
            {data.buyer.phone ? <div>{data.buyer.phone}</div> : null}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              color: '#666',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Event
          </div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: '#111' }}>
            <div style={{ fontWeight: 600 }}>
              {data.event.name} · Theme {data.event.editionNumber}
            </div>
            <div>{data.event.dateLine}</div>
            <div>{data.event.venueName}</div>
            <div>{data.event.venueAddress}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Description', 'Qty', 'Unit', 'Total'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i > 0 ? 'right' : 'left',
                    padding: '12px 0',
                    fontSize: 10,
                    color: '#666',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item) => (
              <tr
                key={`${item.description}-${item.subline ?? ''}`}
                style={{ borderTop: '1px solid #eee' }}
              >
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 500 }}>{item.description}</div>
                  {item.subline ? (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.subline}</div>
                  ) : null}
                </td>
                <td
                  style={{
                    padding: '12px 0',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.isFee || item.isDiscount ? '' : item.qty}
                </td>
                <td
                  style={{
                    padding: '12px 0',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.isFee || item.isDiscount ? '' : formatReceiptCents(item.unitCents)}
                </td>
                <td
                  style={{
                    padding: '12px 0',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatReceiptCents(item.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '100%', maxWidth: 280 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontSize: 14,
              color: '#444',
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatReceiptCents(footerSubtotal)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              fontSize: 14,
              color: '#444',
            }}
          >
            <span>Tax</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatReceiptCents(data.taxCents)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 0 0',
              borderTop: '2px solid #111',
              marginTop: 8,
              fontSize: 18,
              fontWeight: 600,
              color: '#000',
            }}
          >
            <span>Total Paid</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatReceiptCents(data.totalCents)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 6, textAlign: 'right' }}>
            {data.paymentLine}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />

      <div
        style={{
          paddingTop: 18,
          borderTop: '1px solid #ddd',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          fontSize: 10,
          color: '#666',
          lineHeight: 1.6,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              color: '#111',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontSize: 9,
              marginBottom: 6,
            }}
          >
            Transfer
          </div>
          Tickets are transferable up to 24 hours before doors. Use the app or reply to this
          receipt.
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              color: '#111',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontSize: 9,
              marginBottom: 6,
            }}
          >
            Refunds
          </div>
          Tickets are non-refundable but we review case-by-case. Contact us through
          houseoffire.events.
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          width: '100%',
          alignSelf: 'stretch',
          boxSizing: 'border-box',
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          color: '#888',
          letterSpacing: '0.16em',
        }}
      >
        House of Fire · houseoffire.events · Thank you for keeping the room full.
      </div>
    </div>
  );

  return page;
}
