-- ============================================================
-- KIRAYA
-- Migration: finalized exit settlement immutability (P5.4D Defect #2)
--
-- Problem:
-- kiraya.exit_settlements has no trigger protecting it once
-- FINALIZED/SETTLED, unlike kiraya.bills (prevent_finalized_bill_
-- mutation) and kiraya.payments (prevent_posted_payment_mutation).
-- RLS (exit_settlements_update) permits any org-write user to set
-- status, final_amount_due, final_amount_refundable, etc. to
-- anything via a direct UPDATE. Since post_exit_settlement_to_
-- ledger()'s only precondition is status = 'FINALIZED', this is a
-- direct path to posting an arbitrary, fabricated ledger debit --
-- the same vulnerability class already closed for bills, payments,
-- and (P5.4B) security deposit refunds.
--
-- SETTLED is included in the protected set per instruction, even
-- though inspection confirms no function currently transitions any
-- exit_settlements row to SETTLED (it exists only as a computed
-- display label in reporting views, unrelated to this column) --
-- protecting it now is a defensive no-op against today's live data,
-- and correct in case it ever becomes reachable.
--
-- Companion gap (found during inspection, reported rather than
-- silently expanded): kiraya.exit_settlement_items has the
-- identical exposure -- nothing stops an item being inserted or
-- edited after the parent settlement is FINALIZED, which would
-- silently desynchronize the settlement's stored totals from its
-- own line items (calculate_exit_settlement() only ever recomputes
-- those totals once, at finalization). A second, narrow trigger on
-- exit_settlement_items closes this companion path using the same
-- gate. It row-locks the parent settlement before checking status,
-- so a concurrent item insert cannot race a concurrent
-- finalize_exit_settlement() call and land after finalization
-- without being caught.
--
-- No legitimate function needs a kiraya.financial_context escape
-- hatch for either trigger: calculate_exit_settlement()/
-- finalize_exit_settlement() only ever transition a settlement INTO
-- FINALIZED (old.status = 'DRAFT', not yet protected) and never
-- write to exit_settlement_items at all. The escape hatch is kept
-- for consistency with every other immutability trigger in this
-- schema, not because anything currently uses it.
-- ============================================================

create or replace function kiraya.prevent_finalized_exit_settlement_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin
    if old.status in ('FINALIZED', 'SETTLED')
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'A finalized exit settlement cannot be modified directly.';
    end if;

    return new;
end;
$$;


drop trigger if exists trg_prevent_finalized_exit_settlement_mutation
on kiraya.exit_settlements;

create trigger trg_prevent_finalized_exit_settlement_mutation
before update on kiraya.exit_settlements
for each row execute function kiraya.prevent_finalized_exit_settlement_mutation();


comment on function kiraya.prevent_finalized_exit_settlement_mutation() is
    'Blocks direct mutation of a FINALIZED or SETTLED exit settlement outside an authorized financial function.';


create or replace function kiraya.prevent_finalized_exit_settlement_item_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_status kiraya.settlement_status;
begin

    select status
    into v_status
    from kiraya.exit_settlements
    where id = coalesce(new.exit_settlement_id, old.exit_settlement_id)
    for update;

    if v_status in ('FINALIZED', 'SETTLED')
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'Items of a finalized exit settlement cannot be modified directly.';
    end if;

    return new;
end;
$$;


drop trigger if exists trg_prevent_finalized_exit_settlement_item_mutation
on kiraya.exit_settlement_items;

create trigger trg_prevent_finalized_exit_settlement_item_mutation
before insert or update on kiraya.exit_settlement_items
for each row execute function kiraya.prevent_finalized_exit_settlement_item_mutation();


comment on function kiraya.prevent_finalized_exit_settlement_item_mutation() is
    'Blocks insert/update of exit settlement items once the parent settlement is FINALIZED or SETTLED.';
