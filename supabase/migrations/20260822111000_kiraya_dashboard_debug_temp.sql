-- TEMPORARY diagnostic function for P5.8A-R investigation — will be dropped
-- by a follow-up migration once the root cause is confirmed. Read-only,
-- no data mutation, no impact on any other function/view.
create or replace function kiraya._debug_tenant_credit_breakdown(p_organization_id uuid)
returns table(tenant_id uuid, new_cte_balance numeric, new_cte_credit numeric, old_fn_credit numeric, old_fn_due numeric)
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    with tenant_debit_totals as (
        select le.tenant_id, sum(le.debit_amount) as debit_total
        from kiraya.ledger_entries le
        left join kiraya.ledger_entries rev
            on rev.reverses_entry_id = le.id
           and rev.is_reversal = true
        where le.entry_type in ('BILL','EXIT_SETTLEMENT','CREDIT_REFUND')
          and le.is_reversal = false
          and rev.id is null
        group by le.tenant_id
    ),
    tenant_credit_totals as (
        select le.tenant_id, sum(le.credit_amount) as credit_total
        from kiraya.ledger_entries le
        left join kiraya.ledger_entries rev
            on rev.reverses_entry_id = le.id
           and rev.is_reversal = true
        where le.entry_type in ('PAYMENT','DEPOSIT_APPLICATION')
          and le.is_reversal = false
          and rev.id is null
        group by le.tenant_id
    )
    select
        t.id as tenant_id,
        coalesce(td.debit_total,0) - coalesce(tc.credit_total,0) as new_cte_balance,
        greatest(0, -(coalesce(td.debit_total,0) - coalesce(tc.credit_total,0))) as new_cte_credit,
        kiraya.get_tenant_credit(t.id) as old_fn_credit,
        kiraya.get_tenant_due(t.id) as old_fn_due
    from kiraya.tenants t
    left join tenant_debit_totals td on td.tenant_id = t.id
    left join tenant_credit_totals tc on tc.tenant_id = t.id
    where t.organization_id = p_organization_id
      and t.status = 'ACTIVE';
$$;
