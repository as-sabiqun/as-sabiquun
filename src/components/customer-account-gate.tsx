"use client";

import { GoogleMark } from "@/components/google-mark";
import { Modal } from "@/components/modal";

export function CustomerAccountGate({ next, onClose }: { next: string; onClose: () => void }) {
  return (
    <Modal label="Save your order" onClose={onClose}>
      <section className="account-gate">
        <p className="auth-eyebrow">One quick step</p>
        <h2 className="display">Save your order before payment.</h2>
        <p>Use Google to create or access your free customer account. We will keep the details you entered, then take you to secure checkout.</p>
        <ul>
          <li>Your order details stay saved</li>
          <li>You can follow the project</li>
          <li>Your completion report comes here</li>
        </ul>
        <a className="auth-google" href={`/auth/google?next=${encodeURIComponent(next)}`}>
          <GoogleMark /> Continue with Google
        </a>
        <small>New here? Google creates your customer account. Returning? Use the same Google account.</small>
      </section>
    </Modal>
  );
}
