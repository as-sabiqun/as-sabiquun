export function isContactNumber(value: string) {
  return /^\+?[0-9 ()-]{7,25}$/.test(value);
}

export function dollarsToCents(value: number) {
  const cents = Math.round(value * 100);
  return Number.isFinite(value) && value > 0 && Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) <= 0.000_001
    ? cents
    : null;
}
