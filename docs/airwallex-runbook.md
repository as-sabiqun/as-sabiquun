# Airwallex payments runbook

The Airwallex integration is additive. Existing HitPay orders, refunds, webhooks, and reconciliation routes stay operational. An order records its provider when it is created and never switches provider after a payment attempt begins.

## Configuration

Keep `PAYMENT_PROVIDER=hitpay` while preparing and testing the Airwallex account.

```dotenv
PAYMENT_PROVIDER=hitpay
AIRWALLEX_ENV=sandbox
AIRWALLEX_CLIENT_ID=
AIRWALLEX_API_KEY=
AIRWALLEX_WEBHOOK_SECRET=
AIRWALLEX_ACCOUNT_ID=
```

- `AIRWALLEX_ENV`: `sandbox` or `production`.
- `AIRWALLEX_CLIENT_ID` and `AIRWALLEX_API_KEY`: server-only credentials from the Airwallex web app.
- `AIRWALLEX_WEBHOOK_SECRET`: secret belonging specifically to the configured notification URL.
- `AIRWALLEX_ACCOUNT_ID`: optional but recommended. When present, events from another account are rejected.
- Never prefix credentials with `NEXT_PUBLIC_`.

## Database

Apply `supabase/migrations/025_airwallex_payments.sql` before enabling Airwallex. It:

- adds `airwallex` to provider constraints without modifying HitPay history;
- reserves stable UUID idempotency keys for PaymentIntents and refunds;
- records provider event IDs in an append-only deduplication ledger;
- verifies order reference, amount, currency, provider, and event ordering;
- allows only a succeeded PaymentIntent to unlock fulfilment;
- keeps refunds pending until Airwallex accepts or settles them.

## Webhook

Create a webhook subscription pointing to:

```text
https://www.as-sabiqun.com/api/webhooks/airwallex
```

Subscribe to these events:

- `payment_intent.created`
- `payment_intent.requires_payment_method`
- `payment_intent.requires_customer_action`
- `payment_intent.pending`
- `payment_intent.pending_review`
- `payment_intent.succeeded`
- `payment_intent.cancelled`
- `payment_intent.payment_failed` if enabled for the account
- `refund.received`
- `refund.accepted`
- `refund.settled`
- `refund.failed`

The endpoint verifies `x-timestamp` plus the untouched body using HMAC-SHA256, rejects stale deliveries, deduplicates stable Airwallex event IDs, and tolerates out-of-order events.

## Sandbox acceptance

Before switching providers, verify:

- successful card payment;
- 3DS success and abandonment;
- PayNow success and QR timeout on real mobile devices;
- browser Back and hosted-checkout cancellation;
- repeated clicks and network retry create only one PaymentIntent;
- browser return before webhook shows `Checking your payment`;
- browser close before return still confirms from the webhook;
- duplicate and out-of-order webhook deliveries do not downgrade a paid order;
- invalid signature, stale timestamp, wrong account, amount, currency, and reference are rejected;
- partial refund, full refund, duplicate refund retry, and failed refund;
- old HitPay payment and refund operations remain usable.

## Enable and rollback

After sandbox acceptance and account approval, set:

```dotenv
PAYMENT_PROVIDER=airwallex
AIRWALLEX_ENV=production
```

This routes only newly created customer orders to Airwallex. Existing orders continue using their stored provider.

Emergency rollback is `PAYMENT_PROVIDER=hitpay`. Do not delete Airwallex credentials or its webhook subscription during a rollback: already-created Airwallex intents and later refunds still need to complete safely.
