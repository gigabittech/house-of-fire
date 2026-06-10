import { describe, expect, it } from 'vitest';
import { normalizeTicketCode } from './codes';

describe('normalizeTicketCode', () => {
  it('uppercases plain codes', () => {
    expect(normalizeTicketCode('hof-24-0001')).toBe('HOF-24-0001');
  });

  it('extracts code from QR JSON', () => {
    expect(normalizeTicketCode('{"code":"hof-24-0002","eventId":"x"}')).toBe('HOF-24-0002');
  });
});
