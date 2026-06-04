import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatIssuedDate, formatReceiptCents } from './format';
import type { OrderReceiptData, ReceiptLineItem } from './types';

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#111111',
    backgroundColor: '#ffffff',
    flexDirection: 'column',
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
  },
  letterheadLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: { height: 28, width: 150, objectFit: 'contain', objectPosition: 'left' },
  labelCaps: {
    fontSize: 10,
    color: '#666666',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  receiptCode: {
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: 700,
    color: '#111111',
    marginTop: 4,
    letterSpacing: 0.8,
  },
  grid: { flexDirection: 'row', marginTop: 24 },
  colLeft: { flex: 1, paddingRight: 16 },
  colRight: { flex: 1, paddingLeft: 16 },
  body14: { fontSize: 14, lineHeight: 1.5, marginTop: 8, color: '#111111' },
  bold: { fontWeight: 700 },
  table: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
  },
  tableHeader: { flexDirection: 'row', paddingVertical: 12 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  colDesc: { width: '50%' },
  colQty: { width: '12%', textAlign: 'right' },
  colUnit: { width: '19%', textAlign: 'right' },
  colTotal: { width: '19%', textAlign: 'right' },
  descTitle: { fontSize: 13, fontWeight: 500 },
  descFee: { fontSize: 13, color: '#666666' },
  subline: { fontSize: 11, color: '#888888', marginTop: 2 },
  spacer: { flexGrow: 1 },
  totalsWrap: { marginTop: 18, flexDirection: 'row', justifyContent: 'flex-end' },
  totalsBox: { width: 280 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    fontSize: 14,
    color: '#444444',
  },
  totalPaid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#111111',
    fontSize: 18,
    fontWeight: 700,
    color: '#000000',
  },
  paymentNote: { fontSize: 11, color: '#666666', marginTop: 6, textAlign: 'right' },
  footer: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    flexDirection: 'row',
  },
  footerCol: { flex: 1, fontSize: 10, color: '#666666', lineHeight: 1.6, paddingRight: 12 },
  footerColLast: { flex: 1, fontSize: 10, color: '#666666', lineHeight: 1.6, paddingLeft: 12 },
  footerHeading: {
    fontSize: 9,
    fontWeight: 700,
    color: '#111111',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  thanks: {
    width: '100%',
    marginTop: 18,
    textAlign: 'center',
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#888888',
    letterSpacing: 0.8,
  },
});

function LineItemRow({ item }: { item: ReceiptLineItem }) {
  const isFeeOrDiscount = item.isFee || item.isDiscount;

  return (
    <View style={styles.tableRow}>
      <View style={styles.colDesc}>
        <Text style={isFeeOrDiscount ? styles.descFee : styles.descTitle}>{item.description}</Text>
        {item.subline ? <Text style={styles.subline}>{item.subline}</Text> : null}
      </View>
      <Text style={styles.colQty}>{isFeeOrDiscount ? '' : String(item.qty)}</Text>
      <Text style={styles.colUnit}>
        {isFeeOrDiscount ? '' : formatReceiptCents(item.unitCents)}
      </Text>
      <Text style={styles.colTotal}>{formatReceiptCents(item.totalCents)}</Text>
    </View>
  );
}

function ReceiptPdfDocument({
  data,
  logoSrc,
}: {
  data: OrderReceiptData;
  logoSrc: string | null;
}) {
  const footerSubtotal = data.subtotalCents - data.discountCents + data.feeCents;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.letterhead}>
          <View style={styles.letterheadLeft}>
            {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
            <Text style={[styles.labelCaps, { marginTop: logoSrc ? 8 : 0 }]}>
              houseoffire.events · Boulder, CO
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.labelCaps}>Receipt</Text>
            <Text style={styles.receiptCode}>{data.receiptCode}</Text>
            <Text style={{ fontSize: 11, color: '#666666', marginTop: 4 }}>
              Issued {formatIssuedDate(data.issuedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.colLeft}>
            <Text style={styles.labelCaps}>Buyer</Text>
            <View style={styles.body14}>
              <Text style={styles.bold}>{data.buyer.name}</Text>
              <Text>{data.buyer.email}</Text>
              {data.buyer.phone ? <Text>{data.buyer.phone}</Text> : null}
            </View>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.labelCaps}>Event</Text>
            <View style={styles.body14}>
              <Text style={styles.bold}>
                {data.event.name} · Edition {data.event.editionNumber}
              </Text>
              <Text>{data.event.dateLine}</Text>
              <Text>{data.event.venueName}</Text>
              <Text>{data.event.venueAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.labelCaps]}>Description</Text>
            <Text style={[styles.colQty, styles.labelCaps]}>Qty</Text>
            <Text style={[styles.colUnit, styles.labelCaps]}>Unit</Text>
            <Text style={[styles.colTotal, styles.labelCaps]}>Total</Text>
          </View>
          {data.lineItems.map((item, i) => (
            <LineItemRow key={`${item.description}-${i}`} item={item} />
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatReceiptCents(footerSubtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{formatReceiptCents(data.taxCents)}</Text>
            </View>
            <View style={styles.totalPaid}>
              <Text>Total Paid</Text>
              <Text>{formatReceiptCents(data.totalCents)}</Text>
            </View>
            <Text style={styles.paymentNote}>{data.paymentLine}</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerHeading}>Transfer</Text>
            <Text>
              Tickets are transferable up to 24 hours before doors. Use the app or reply to this
              receipt.
            </Text>
          </View>
          <View style={styles.footerColLast}>
            <Text style={styles.footerHeading}>Refunds</Text>
            <Text>
              Tickets are non-refundable but we review case-by-case. Contact us through
              houseoffire.events.
            </Text>
          </View>
        </View>

        <Text style={styles.thanks}>
          House of Fire · houseoffire.events · Thank you for keeping the room full.
        </Text>
      </Page>
    </Document>
  );
}

export function getReceiptPdfDocument(data: OrderReceiptData, logoSrc: string | null) {
  return <ReceiptPdfDocument data={data} logoSrc={logoSrc} />;
}
