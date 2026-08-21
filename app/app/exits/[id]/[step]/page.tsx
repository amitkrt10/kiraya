import { notFound, redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getLease } from "@/lib/queries/leases";
import { getLeaseRentRules } from "@/lib/queries/rentRules";
import { getSecurityDeposit, getSecurityDepositHeld, getSecurityDepositTransactions } from "@/lib/queries/securityDeposits";
import { getActivePaymentMethodsForPicker } from "@/lib/queries/paymentMethods";
import {
  getTenantExit,
  getExitSettlement,
  getExitSettlementItems,
  getExitTenantStatement,
  getDepositRefunds,
  getOutstandingBillsForTenant,
} from "@/lib/queries/tenantExits";
import { getTenantOutstanding } from "@/lib/queries/financial";
import { calculateExitSettlement } from "@/lib/mutations/tenantExits";
import { EXIT_STEPS, resolveReachableStep, canEditAdjustments, canFinalizeSettlement, canCompleteExit, type ExitStepSlug } from "@/lib/tenantExitSteps";
import { ExitStepRail } from "@/components/tenantExits/ExitStepRail";
import { Step2Review } from "@/components/tenantExits/steps/Step2Review";
import { Step3Dues } from "@/components/tenantExits/steps/Step3Dues";
import { Step4Deposit } from "@/components/tenantExits/steps/Step4Deposit";
import { Step5Adjustments } from "@/components/tenantExits/steps/Step5Adjustments";
import { Step6Settlement } from "@/components/tenantExits/steps/Step6Settlement";
import { Step7Statement } from "@/components/tenantExits/steps/Step7Statement";
import { Step8Refund } from "@/components/tenantExits/steps/Step8Refund";
import { Step9Completion } from "@/components/tenantExits/steps/Step9Completion";
import { isUuid } from "@/lib/utils/uuid";

export default async function TenantExitStepPage({ params }: { params: Promise<{ id: string; step: string }> }) {
  const { id, step } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const stepMeta = EXIT_STEPS.find((s) => s.slug === step);
  if (!stepMeta || stepMeta.n === 1) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const canWrite = await canWriteOrganization(organizationId);

  const exit = await getTenantExit(id, organizationId);
  if (!exit) {
    notFound();
  }

  const settlement = await getExitSettlement(exit.id, organizationId);

  const reachable = resolveReachableStep(exit, settlement);
  if (stepMeta.n > reachable) {
    const target = EXIT_STEPS.find((s) => s.n === reachable);
    redirect(`/app/exits/${exit.id}/${target?.slug ?? "review"}`);
  }

  const lease = await getLease(exit.lease_id, organizationId);
  if (!lease) {
    notFound();
  }

  const basePath = `/app/exits/${exit.id}`;
  const stepHref = (n: number) => `${basePath}/${EXIT_STEPS.find((s) => s.n === n)?.slug}`;

  const tenantName = lease.tenants?.display_name ?? "This tenant";
  const unitLabel = `${lease.units?.unit_code ?? ""}${lease.units?.properties ? `, ${lease.units.properties.name}` : ""}`;

  const railProps = {
    exitReference: exit.exit_reference,
    currentStep: stepMeta.n,
    reachableStep: reachable,
    basePath,
  };

  async function renderStep(slug: ExitStepSlug) {
    switch (slug) {
      case "review": {
        const rentRules = await getLeaseRentRules(lease!.id, organizationId);
        const currentRentRule = rentRules.find((r) => r.is_active) ?? null;
        return <Step2Review lease={lease!} currentRentRule={currentRentRule} nextHref={stepHref(3)} backHref={null} />;
      }
      case "dues": {
        const [bills, totalOutstanding] = await Promise.all([
          getOutstandingBillsForTenant(exit!.tenant_id, organizationId),
          getTenantOutstanding(exit!.tenant_id),
        ]);
        return (
          <Step3Dues bills={bills} totalOutstanding={totalOutstanding} currencyCode={lease!.currency_code} nextHref={stepHref(4)} backHref={stepHref(2)} />
        );
      }
      case "deposit": {
        const deposit = await getSecurityDeposit(exit!.tenant_id, organizationId);
        const [held, transactions] = deposit
          ? await Promise.all([getSecurityDepositHeld(deposit.id), getSecurityDepositTransactions(deposit.id, organizationId)])
          : [0, []];
        return <Step4Deposit deposit={deposit} held={held} transactions={transactions} nextHref={stepHref(5)} backHref={stepHref(3)} />;
      }
      case "adjustments": {
        const items = await getExitSettlementItems(settlement!.id, organizationId);
        const chargeItems = items.filter((item) => !item.is_credit);
        const historicalCreditItems = items.filter((item) => item.is_credit);
        return (
          <Step5Adjustments
            chargeItems={chargeItems}
            historicalCreditItems={historicalCreditItems}
            currencyCode={settlement!.currency_code}
            exitSettlementId={settlement!.id}
            tenantId={exit!.tenant_id}
            canWrite={canWrite}
            canEdit={canEditAdjustments(settlement)}
            nextHref={stepHref(6)}
            backHref={stepHref(4)}
          />
        );
      }
      case "settlement": {
        // Recalculate on every visit while still DRAFT so the figures shown are always current — never stale, never computed here.
        let settlementForDisplay = settlement!;
        if (settlementForDisplay.status === "DRAFT") {
          const recalculated = await calculateExitSettlement(settlementForDisplay.id);
          if (recalculated.data) {
            settlementForDisplay = recalculated.data;
          }
        }
        return (
          <Step6Settlement
            settlement={settlementForDisplay}
            canWrite={canWrite}
            canFinalize={canFinalizeSettlement(settlementForDisplay)}
            tenantId={exit!.tenant_id}
            nextHref={stepHref(7)}
            backHref={stepHref(5)}
          />
        );
      }
      case "statement": {
        const statement = await getExitTenantStatement(settlement!.id, organizationId);
        if (!statement) {
          notFound();
        }
        return <Step7Statement statement={statement} currencyCode={settlement!.currency_code} nextHref={stepHref(8)} backHref={stepHref(6)} />;
      }
      case "refund": {
        const deposit = await getSecurityDeposit(exit!.tenant_id, organizationId);
        const [held, existingRefunds, paymentMethods] = await Promise.all([
          deposit ? getSecurityDepositHeld(deposit.id) : Promise.resolve(0),
          getDepositRefunds(settlement!.id, organizationId),
          getActivePaymentMethodsForPicker(organizationId),
        ]);
        const alreadyRecorded = existingRefunds
          .filter((r) => r.status !== "CANCELLED" && r.status !== "FAILED")
          .reduce((sum, r) => sum + r.amount, 0);
        const remainingRefundable = Math.max(0, Math.round((settlement!.final_amount_refundable - alreadyRecorded) * 100) / 100);
        return (
          <Step8Refund
            settlement={settlement!}
            depositHeld={held}
            hasDeposit={Boolean(deposit)}
            existingRefunds={existingRefunds}
            remainingRefundable={remainingRefundable}
            paymentMethods={paymentMethods}
            canWrite={canWrite}
            tenantId={exit!.tenant_id}
            nextHref={stepHref(9)}
            backHref={stepHref(7)}
          />
        );
      }
      case "completion": {
        const refunds = await getDepositRefunds(settlement!.id, organizationId);
        const completedRefunds = refunds.filter((r) => r.status === "COMPLETED");
        return (
          <Step9Completion
            exit={exit!}
            settlement={settlement!}
            completedRefunds={completedRefunds}
            tenantName={tenantName}
            unitLabel={unitLabel}
            leaseCode={lease!.lease_code}
            canWrite={canWrite}
            canComplete={canCompleteExit(exit, settlement)}
          />
        );
      }
      default:
        notFound();
    }
  }

  const content = await renderStep(stepMeta.slug);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - var(--topbar-height))", background: "var(--color-bg)" }}>
      <ExitStepRail {...railProps} />
      <div style={{ flex: "1 1 auto", padding: "32px 40px", maxWidth: 760 }}>
        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 6 }}>
          {context.organization.organizationName} / Tenant Exits / {exit.exit_reference}
        </div>
        {content}
      </div>
    </div>
  );
}
