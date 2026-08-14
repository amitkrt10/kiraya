-- ============================================================
-- KIRAYA
-- Migration: security deposit balance
--
-- Purpose:
-- Calculates security deposit balances from the transaction
-- history.
--
-- Receipt     → increases deposit held
-- Deduction   → decreases deposit held
-- Refund      → decreases deposit held
-- Adjustment  → depends on direction stored in metadata
--
-- The summary values on security_deposits are maintained by
-- a separate synchronization function.
-- ============================================================


create or replace function kiraya.get_security_deposit_received(
    p_security_deposit_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select coalesce(
        sum(amount),
        0
    )
    from kiraya.security_deposit_transactions
    where security_deposit_id = p_security_deposit_id
      and transaction_type = 'RECEIPT';
$$;


create or replace function kiraya.get_security_deposit_deducted(
    p_security_deposit_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select coalesce(
        sum(amount),
        0
    )
    from kiraya.security_deposit_transactions
    where security_deposit_id = p_security_deposit_id
      and transaction_type = 'DEDUCTION';
$$;


create or replace function kiraya.get_security_deposit_refunded(
    p_security_deposit_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select coalesce(
        sum(amount),
        0
    )
    from kiraya.security_deposit_transactions
    where security_deposit_id = p_security_deposit_id
      and transaction_type = 'REFUND';
$$;


create or replace function kiraya.get_security_deposit_held(
    p_security_deposit_id uuid
)
returns numeric
language sql
stable
security invoker
set search_path = kiraya, public
as $$
    select greatest(
        0,
        kiraya.get_security_deposit_received(p_security_deposit_id)
        -
        kiraya.get_security_deposit_deducted(p_security_deposit_id)
        -
        kiraya.get_security_deposit_refunded(p_security_deposit_id)
    );
$$;


comment on function kiraya.get_security_deposit_received(uuid) is
    'Returns total security deposit receipts.';

comment on function kiraya.get_security_deposit_deducted(uuid) is
    'Returns total security deposit deductions.';

comment on function kiraya.get_security_deposit_refunded(uuid) is
    'Returns total security deposit refunds.';

comment on function kiraya.get_security_deposit_held(uuid) is
    'Returns the current security deposit still held.';