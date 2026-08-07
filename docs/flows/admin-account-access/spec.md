# Flow Spec: Admin account access

> ⚠️ PROVISIONAL — built from the existing product and official Supabase documentation, not captured Mobbin data. Re-authenticate Mobbin and verify later.

## Goal

Let an authorized administrator create a staff account and email its direct sign-in details immediately, without depending on an invitation link.

## Reference and rationale

- Reference: existing As-Sabiqun team-access and sign-in interfaces.
- Adopted pattern: one clear creation form, direct sign-in, visible account state, and recovery controlled by a higher-authority administrator.
- Deliberately omitted: invitation tokens, custom password-reset infrastructure, and a second onboarding wizard.

## States

| State | User action | Next |
|---|---|---|
| Create account | Enter name, email, role, and matching password | Account is ready |
| Ready | Resend emails the login address and chosen password | Administrator signs in |
| Sign in | Enter email and password | Admin console or MFA |
| Password recovery | Owner sets a replacement password in Team access | Administrator signs in again |
| Suspended | Sign-in is rejected | Owner restores access |

## Rules

- Only an owner can create owners or administrators; administrators may create operations staff.
- Passwords are 12–72 characters and never placed in URLs, logs, or confirmation messages.
- The chosen password is sent only in the account email. If delivery fails, the new account is removed.
- Accounts are email-confirmed server-side because the account is created by trusted staff.
- MFA remains a separate sign-in gate and resumes after the approved temporary bypass.
- An administrator cannot set their own password from an authenticated session; another authorized administrator must do it.

## Acceptance criteria

- [x] Creating an account sends direct login details without using an invitation link.
- [x] The created account can sign in directly at `/admin/sign-in`.
- [x] Authorized staff can replace another administrator’s password.
- [x] Role hierarchy, suspension, removal, and final-owner protections remain enforced.
- [x] Invalid, short, or mismatched passwords are rejected server-side.
