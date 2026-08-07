// Temporary owner-approved bypass. MFA automatically resumes at midnight SGT on 22 August 2026.
export const ADMIN_MFA_BYPASS_UNTIL = Date.parse("2026-08-21T16:00:00Z");

export function isAdminMfaBypassActive(now = Date.now()) {
  return now < ADMIN_MFA_BYPASS_UNTIL;
}
