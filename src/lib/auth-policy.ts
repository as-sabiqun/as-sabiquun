export const ADMIN_MFA_BYPASS_UNTIL = Date.parse("2026-07-26T18:00:00Z");

export function isAdminMfaBypassActive(now = Date.now()) {
  return now < ADMIN_MFA_BYPASS_UNTIL;
}
