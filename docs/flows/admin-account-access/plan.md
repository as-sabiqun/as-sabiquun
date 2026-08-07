# Task Plan: Admin account access

> Source spec: `docs/flows/admin-account-access/spec.md`

## Tasks

1. Replace invitation-based creation with Supabase server-side account creation.
2. Add password and confirmation validation at the server boundary.
3. Add an authorized Set password action for existing administrators.
4. Remove invitation and email-reset controls from Team access and admin sign-in.
5. Verify role hierarchy, sign-in, lint, types, tests, and production build.

## Checkpoint

Implementation was explicitly approved by the user’s request to replace the current admin-login logic.
