# Access and operations implementation plan

## 1. Confirm the domain flow

- [x] Audit the current vendor and dashboard implementation.
- [x] Compare current authentication guidance and operational patterns.
- [x] Capture Attio login and Shopify onboarding references from Mobbin.
- [x] Define route ownership and the minimum role model.

## 2. Complete the admin prototype

- [x] Add a private, unlinked `/admin` entry.
- [x] Build Orders, Vendors, and Reports workspace views.
- [x] Add order queue filters and record details.
- [x] Add assignment, re-assignment, proof approval, and request-changes interactions.
- [x] Add report resolution and useful empty/confirmation states.
- [x] Add a tested demo transition function.

## 3. Tighten the vendor prototype

- [x] Make proof preparation a complete bundle rather than a misleading single-file upload.
- [x] Add dignified-media and minimum-contact guidance.
- [x] Keep every vendor action aligned with a matching admin state.
- [x] Recheck desktop and mobile queue/detail behavior.

## 4. Replace the access gateway

- [x] Redesign `/login` as one Vendor/Customer role chooser and one focused form.
- [x] Put Vendor first as requested; keep the selected role visually explicit.
- [x] Show the right method and expectation for invited vendors versus customers.
- [x] Remove every public admin entry point.
- [x] Add a restrained preview hand-off while production providers are not configured.
- [x] Add progressive Customer/Vendor onboarding preview states.

## 5. Document production auth closure

- [x] Record the Supabase profile/order/proof migration needed for customer ownership and account states.
- [x] Record server guards, RLS, OAuth callback, OTP confirmation, onboarding, and MFA requirements.
- [x] Keep provider activation out of the prototype until credentials and SMTP are available.

## 6. Verify

- [x] Run unit tests.
- [x] Run lint.
- [x] Run the production build.
- [x] Visually inspect `/login`, `/onboarding`, `/dashboard`, `/vendor-dashboard`, `/admin`, and `/admin/sign-in` at desktop and mobile widths.
- [x] Fix any functional, accessibility, or visual regressions found.
