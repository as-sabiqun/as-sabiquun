"use client";

import { GoogleMark } from "@/components/google-mark";
import { Modal } from "@/components/modal";

export function CustomerAccountGate({ next, onClose }: { next: string; onClose: () => void }) {
  return (
    <Modal label="Save your order" onClose={onClose}>
      <section className="account-gate">
        <p className="auth-eyebrow">One quick step</p>
        <h2 className="display">Save your order before payment.</h2>
        <p>Use Google or email to create or access your free customer account. We will keep the details you entered, then take you to secure checkout.</p>
        <ul>
          <li>Your order details stay saved</li>
          <li>You can follow the project</li>
          <li>Your completion report comes here</li>
        </ul>
        <form action="/auth/email" method="post" className="account-gate-email">
          <input type="hidden" name="next" value={next} />
          <label className="label">Email address
            <input className="input" type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
          </label>
          <button type="submit" className="btn">Email me a six-digit code</button>
        </form>
        <div className="account-gate-divider"><span>or</span></div>
        <a className="auth-google" href={`/auth/google?next=${encodeURIComponent(next)}`}><GoogleMark /> Continue with Google</a>
        <small>New here? Either option creates your customer account. Returning? Use the same email or Google account.</small>
      </section>
    </Modal>
  );
}
