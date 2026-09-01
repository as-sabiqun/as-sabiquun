import { Check, KeyRound, LayoutDashboard, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand";
import styles from "./admin-access.module.css";

const accessRoute = [
  { key: "credentials", label: "Credentials", detail: "Confirm the assigned administrator account.", icon: KeyRound },
  { key: "authenticator", label: "Authenticator", detail: "Verify the signed-in administrator account.", icon: ShieldCheck },
  { key: "console", label: "Admin console", detail: "Continue to the requested operations page.", icon: LayoutDashboard },
] as const;

type AccessStage = (typeof accessRoute)[number]["key"];

export function AdminAccessLedger({
  currentStage,
  heading,
  description,
}: {
  currentStage: AccessStage;
  heading: string;
  description: string;
}) {
  const currentIndex = accessRoute.findIndex((stage) => stage.key === currentStage);

  return (
    <aside className={styles.ledger} aria-labelledby="admin-route-title">
      <div className={styles.adminIdentity}>
        <BrandMark className={styles.seal} priority />
        <span><strong>As-Sābiqūn</strong><small>Admin console</small></span>
      </div>

      <div className={styles.ledgerIntro}>
        <ShieldCheck aria-hidden="true" />
        <h2 id="admin-route-title">{heading}</h2>
        <p>{description}</p>
      </div>

      <ol className={styles.accessRoute} aria-label="Administrator access route">
        {accessRoute.map(({ key, label, detail, icon: Icon }, index) => {
          const current = key === currentStage;
          const complete = index < currentIndex;
          return (
            <li
              key={key}
              className={current ? styles.currentStep : complete ? styles.completedStep : undefined}
              aria-current={current ? "step" : undefined}
            >
              <span className={styles.stepMark}>{complete ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
              <span><small>{String(index + 1).padStart(2, "0")}</small><strong>{label}</strong><p>{detail}</p></span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
