-- ============================================================
-- KIRAYA
-- P1.1: financial bill accounting
--
-- IMPORTANT ACCOUNTING RULE
--
-- A new bill may display:
--
--   Current charges       ₹30,000
--   Previous due          ₹10,000
--   -----------------------------
--   Amount payable        ₹40,000
--
-- But the ₹10,000 previous due already exists in the tenant
-- ledger.
--
-- Therefore:
--
--   Bill snapshot total       = ₹40,000
--   New ledger debit          = ₹30,000
--
-- This prevents previous dues from being double-counted.
-- ============================================================


create or replace function kiraya.get_bill_current_charge_amount(
    p_bill_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        0,
        round(
            coalesce(b.total_amount, 0)
            -
            coalesce(b.previous_balance_amount, 0),
            2
        )
    )
    from kiraya.bills b
    where b.id = p_bill_id;
$$;


create or replace function kiraya.get_bill_total_payable(
    p_bill_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        0,
        round(
            coalesce(b.total_amount, 0),
            2
        )
    )
    from kiraya.bills b
    where b.id = p_bill_id;
$$;


comment on function kiraya.get_bill_current_charge_amount(uuid) is
    'Returns only the new financial charge created by a bill, excluding carried-forward previous dues.';

comment on function kiraya.get_bill_total_payable(uuid) is
    'Returns the complete bill amount payable, including any carried-forward previous balance.';