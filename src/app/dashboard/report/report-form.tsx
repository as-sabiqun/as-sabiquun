"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { submitCustomerReport } from "./actions";
import styles from "../dashboard.module.css";

export interface ReportOrderOption {
  id: string;
  reference: string;
  title: string;
}

export function ReportForm({ orders, selectedOrderId }: { orders: ReportOrderOption[]; selectedOrderId?: string }) {
  const [state, action, pending] = useActionState(submitCustomerReport, undefined);

  return (
    <form action={action} className={styles.reportForm}>
      {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="auth-message" role="status">Your report has been received. We will review it from the admin portal.</p>}

      <div className={styles.reportFormGrid}>
        <label className="label">What is this about?
          <select className="input" name="category" required defaultValue="">
            <option value="" disabled>Choose a category</option>
            <option value="order">Order progress</option>
            <option value="payment">Payment or receipt</option>
            <option value="evidence">Completion photos or report</option>
            <option value="account">My account</option>
            <option value="other">Something else</option>
          </select>
        </label>
        <label className="label">Related order <span className={styles.optional}>Optional</span>
          <select className="input" name="order_id" defaultValue={selectedOrderId ?? ""}>
            <option value="">Not related to one order</option>
            {orders.map((order) => <option key={order.id} value={order.id}>{order.reference} — {order.title}</option>)}
          </select>
        </label>
      </div>

      <label className="label">Subject
        <input className="input" name="subject" required minLength={4} maxLength={120} placeholder="A short description of the issue" />
      </label>
      <label className="label">What happened?
        <textarea className={`input ${styles.reportTextarea}`} name="message" required minLength={20} maxLength={2000} placeholder="Share the details we need to investigate this properly." />
      </label>
      <button type="submit" className={styles.primaryAction} disabled={pending}>
        <Send aria-hidden="true" /> {pending ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
