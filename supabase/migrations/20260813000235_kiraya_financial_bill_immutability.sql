-- ============================================================
-- KIRAYA
-- P1/P2 repair: finalized bill immutability
-- ============================================================

create or replace function kiraya.prevent_finalized_bill_mutation()
returns trigger
language plpgsql
security invoker
set search_path = kiraya, public
as $$
begin
    if old.status in ('FINALIZED','PAID','PARTIALLY_PAID')
       and coalesce(current_setting('kiraya.financial_context', true), '') <> '1' then
        raise exception using
            errcode = '23514',
            message = 'Finalized financial records cannot be modified directly.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_prevent_finalized_bill_mutation on kiraya.bills;

create trigger trg_prevent_finalized_bill_mutation
before update on kiraya.bills
for each row execute function kiraya.prevent_finalized_bill_mutation();
