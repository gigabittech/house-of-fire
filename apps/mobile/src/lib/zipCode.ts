/** Format user input as a US ZIP (5 digits) or ZIP+4 (#####-####). */
export function formatZipCodeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidZipCode(zip: string): boolean {
  const trimmed = zip.trim();
  return /^\d{5}$/.test(trimmed) || /^\d{5}-\d{4}$/.test(trimmed);
}

/** Normalize to canonical ZIP or ZIP+4 before persisting. */
export function normalizeZipCode(zip: string): string {
  const digits = zip.replace(/\D/g, '');
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  if (digits.length === 5) return digits;
  return zip.trim();
}
