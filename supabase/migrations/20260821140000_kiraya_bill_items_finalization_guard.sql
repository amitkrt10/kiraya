-- ============================================================
-- KIRAYA
-- Migration: bill_items finalization guard
--
-- Purpose:
-- P5.5B Defect A repair. kiraya.bills is protected from direct
-- mutation once FINALIZED/PARTIALLY_PAID/PAID by
-- prevent_finalized_bill_mutation(), but its child bill_items
-- rows had no equivalent guard — any org-write user could UPDATE
-- a bill_item (rent, previous-due, or utility) on an
-- already-finalized bill directly, silently desyncing the bill's
-- stored subtotal/total_amount from its own line items.
--
-- This mirrors the existing prevent_finalized_exit_settlement_
-- item_mutation() pattern: block UPDATE while the parent's status
-- is in the finalized set, unless the trusted kiraya.
-- financial_context flag is set for a genuine internal workflow.
--
-- Confirmed safe (P5.5B investigation): finalize_bill(),
-- sync_bill_payment_status(), handle_bill_finalization(),
-- handle_bill_payment_allocation(), and void_bill() were all
-- inspected in full — none of them write to bill_items after
-- DRAFT. This trigger introduces no regression to any existing
-- flow, and the financial_context bypass exists only for
-- consistency with the established pattern / future use.
--
-- DELETE is already default-denied on bill_items — no DELETE
-- policy exists in RLS — so no DELETE guard is added here.
-- ============================================================

create or replace function kiraya.prevent_finalized_bill_item_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill_status kiraya.bill_status;
begin

    select status
    into v_bill_status
    from kiraya.bills
    where id = old.bill_id;

    if v_bill_status in ('FINALIZED', 'PARTIALLY_PAID', 'PAID')
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then

        raise exception
            using
                errcode = '23514',
                message = 'Bill items of a finalized bill cannot be modified directly.';
    end if;

    return new;
end;
$$;

create trigger trg_prevent_finalized_bill_item_mutation
before update on kiraya.bill_items
for each row
execute function kiraya.prevent_finalized_bill_item_mutation();

comment on function kiraya.prevent_finalized_bill_item_mutation() is
    'Blocks direct UPDATE of a bill_item once its parent bill is FINALIZED/PARTIALLY_PAID/PAID, mirroring prevent_finalized_bill_mutation() for bills itself. Applies to every bill_item type (RENT, PREVIOUS_DUE, UTILITY, etc.), not just utility items.';
