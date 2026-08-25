import Link from "next/link";
import { Check } from "lucide-react";
import { EXIT_STEPS } from "@/lib/tenantExitSteps";
import styles from "./ExitWizardLayout.module.css";

export function ExitStepRail({
  exitReference,
  currentStep,
  reachableStep,
  basePath,
}: {
  exitReference: string;
  currentStep: number;
  reachableStep: number;
  basePath: string;
}) {
  return (
    <div
      className={styles.rail}
      style={{
        padding: "28px 20px",
        background: "var(--color-surface)",
      }}
    >
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-700)", marginBottom: 4 }}>
        Tenant Exit
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, marginBottom: 24 }}>{exitReference}</div>

      {EXIT_STEPS.map((step) => {
        const done = step.n < currentStep;
        const current = step.n === currentStep;
        const unlocked = step.n <= reachableStep;
        const textColor = current ? "var(--color-text)" : done ? "var(--color-neutral-700)" : "var(--color-neutral-300)";

        const content = (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 8px",
              marginBottom: 2,
              borderLeft: `3px solid ${current ? "var(--color-accent)" : "transparent"}`,
              background: current ? "var(--color-neutral-100)" : "transparent",
            }}
          >
            <div style={{ flex: "0 0 auto", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: current ? "var(--color-accent-700)" : "var(--color-neutral-700)" }}>
              {done ? <Check width={14} height={14} color="var(--color-success)" aria-hidden="true" /> : String(step.n).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 13, fontWeight: current ? 700 : 600, color: textColor, lineHeight: 1.3, paddingTop: 1 }}>{step.label}</div>
          </div>
        );

        if (!unlocked || current) {
          return <div key={step.slug}>{content}</div>;
        }

        return (
          <Link key={step.slug} href={`${basePath}/${step.slug}`} style={{ display: "block", textDecoration: "none" }}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
