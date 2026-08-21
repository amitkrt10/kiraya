-- ============================================================
-- KIRAYA
-- Migration: deposit refund cumulative cap (P5.4D Defect #3)
--
-- Problem:
-- kiraya.deposit_refunds.amount has no connection to
-- kiraya.exit_settlements.final_amount_refundable -- the row is
-- direct-client-INSERT only (no RPC), no trigger validates amount
-- against the linked settlement, and RLS (deposit_refunds_insert/
-- _update) permits any org-write user to set it to anything the
-- P5.4B "cannot exceed amount currently held" check allows,
-- independent of what the settlement actually calculated as
-- refundable.
--
-- Inspection (per instruction, not guessed):
-- deposit_refunds_settlement_idx is a plain, non-unique index on
-- exit_settlement_id, and no unique constraint restricts a
-- settlement to a single refund row. No consumer -- application or
-- database -- currently exists (no UI was built for this; P5.4C
-- explicitly excluded it). The schema naturally supports multiple
-- refund rows per settlement (e.g. a partial refund now, the
-- remainder later, or a refund split across payment methods), so
-- this repair enforces the cumulative model: the sum of every
-- non-CANCELLED/FAILED deposit_refunds row for a given
-- exit_settlement_id must never exceed that settlement's
-- final_amount_refundable.
--
-- The legitimate refund-completion path (deposit_refunds -> status
-- = COMPLETED -> process_completed_deposit_refund() -> REFUND
-- transaction) is unaffected: this trigger runs before that one,
-- gates on amount/exit_settlement_id/status only, and does not
-- touch security_deposit_transactions. The P5.4B block on direct
-- REFUND transaction insertion is untouched.
--
-- Concurrency: the trigger row-locks the parent exit_settlements
-- row before summing existing refunds, serializing concurrent
-- INSERT/UPDATE attempts against the same exit_settlement_id the
-- same way validate_security_deposit_transaction() already
-- serializes concurrent deposit transactions against the same
-- security_deposits row.
-- ============================================================

create or replace function kiraya.validate_deposit_refund_cap()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_settlement kiraya.exit_settlements%rowtype;
    v_other_total numeric(18,2);
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = new.exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;


    select coalesce(sum(amount), 0)
    into v_other_total
    from kiraya.deposit_refunds
    where exit_settlement_id = new.exit_settlement_id
      and status not in ('CANCELLED', 'FAILED')
      and id <> new.id;


    if new.status not in ('CANCELLED', 'FAILED')
       and (v_other_total + new.amount) > v_settlement.final_amount_refundable then

        raise exception
            using
                errcode = '23514',
                message = 'Total deposit refunds for this exit settlement cannot exceed the settlement''s refundable amount.';
    end if;


    return new;
end;
$$;


drop trigger if exists trg_validate_deposit_refund_cap
on kiraya.deposit_refunds;

create trigger trg_validate_deposit_refund_cap
before insert or update on kiraya.deposit_refunds
for each row execute function kiraya.validate_deposit_refund_cap();


comment on function kiraya.validate_deposit_refund_cap() is
    'Ensures the cumulative amount of non-cancelled/failed deposit refunds for an exit settlement never exceeds its final_amount_refundable.';
