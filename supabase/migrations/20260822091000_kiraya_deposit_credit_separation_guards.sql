-- P5.7F Migration B — deposit/refund guards for the deposit/credit separation model.
--
-- 1. Blocks new exit_settlement_items.DEPOSIT_DEDUCTION rows (P5.7E §9 — that path is
--    deprecated; deposit consumption is now derived and posted automatically at
--    finalization, migration C).
-- 2. Fixes kiraya.validate_deposit_refund_cap() to cap against the deposit's own live
--    held balance (kiraya.get_security_deposit_held()), not an unrelated settlement
--    figure (final_amount_refundable) — closes the P5.7B/P5.7D-confirmed gap.
-- 3. Adds kiraya.validate_credit_refund_cap() for the new Pool A (credit-origin)
--    refund table, capped against exit_settlements.credit_origin_refundable — the two
--    caps are now structurally scoped to their own pools and can never cross-authorize
--    each other's money.

create or replace function kiraya.prevent_deposit_deduction_item()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
begin
    if new.item_type = 'DEPOSIT_DEDUCTION' then
        raise exception
            using
                errcode = '23514',
                message = 'DEPOSIT_DEDUCTION exit settlement items are deprecated (P5.7F) — deposit '
                          || 'consumption is now derived automatically at settlement finalization, '
                          || 'never entered as a free-standing line item.';
    end if;
    return new;
end;
$function$;

comment on function kiraya.prevent_deposit_deduction_item() is
  'P5.7F: blocks any new exit_settlement_items row of the deprecated DEPOSIT_DEDUCTION type. '
  'The enum value itself is retained (zero historical rows depend on it) but can no longer be used.';

create trigger trg_prevent_deposit_deduction_item
  before insert on kiraya.exit_settlement_items
  for each row execute function kiraya.prevent_deposit_deduction_item();

-- Re-scope the deposit refund cap to the deposit's OWN live held balance, and to the
-- deposit as a whole (security_deposit_id) rather than to one settlement — a security
-- deposit is the authoritative pool; get_security_deposit_held() is already exactly
-- "how much is safe to refund right now," so nothing else should be consulted.
create or replace function kiraya.validate_deposit_refund_cap()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
declare
    v_other_total numeric(18,2);
    v_held numeric(18,2);
begin

    -- Lock the deposit itself (not the settlement) — it is the authoritative pool
    -- this cap protects.
    perform 1
    from kiraya.security_deposits
    where id = new.security_deposit_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Security deposit does not exist.';
    end if;


    select coalesce(sum(amount), 0)
    into v_other_total
    from kiraya.deposit_refunds
    where security_deposit_id = new.security_deposit_id
      and status not in ('CANCELLED', 'FAILED')
      and id <> new.id;


    v_held := kiraya.get_security_deposit_held(new.security_deposit_id);


    if new.status not in ('CANCELLED', 'FAILED')
       and (v_other_total + new.amount) > v_held then

        raise exception
            using
                errcode = '23514',
                message = 'Total deposit refunds for this security deposit cannot exceed the amount '
                          || 'currently held.',
                detail = format(
                    'Currently held: %s. Already-recorded refunds: %s. Requested: %s.',
                    v_held,
                    v_other_total,
                    new.amount
                );
    end if;


    return new;
end;
$function$;

comment on function kiraya.validate_deposit_refund_cap() is
  'P5.7F: cap is kiraya.get_security_deposit_held() (the deposit''s live actual balance), never '
  'a settlement-computed figure (P5.7B §8 / P5.7D fix). Scoped per security_deposit_id, not per '
  'exit_settlement_id, since the deposit itself — not any one settlement — is the true pool.';

-- New: the analogous cap for Pool A (credit-origin) refunds, scoped to the settlement
-- that authorized them (credit_origin_refundable has no independent "held" concept —
-- it is entirely a settlement-computed figure, correctly, since it derives from the
-- tenant ledger, not from a standing pool like a deposit).
create or replace function kiraya.validate_credit_refund_cap()
returns trigger
language plpgsql
set search_path to 'kiraya', 'public'
as $function$
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
    from kiraya.tenant_credit_refunds
    where exit_settlement_id = new.exit_settlement_id
      and status not in ('CANCELLED', 'FAILED')
      and id <> new.id;


    if new.status not in ('CANCELLED', 'FAILED')
       and (v_other_total + new.amount) > v_settlement.credit_origin_refundable then

        raise exception
            using
                errcode = '23514',
                message = 'Total credit refunds for this exit settlement cannot exceed the '
                          || 'settlement''s credit-origin refundable amount.',
                detail = format(
                    'Credit-origin refundable: %s. Already-recorded refunds: %s. Requested: %s.',
                    v_settlement.credit_origin_refundable,
                    v_other_total,
                    new.amount
                );
    end if;


    return new;
end;
$function$;

comment on function kiraya.validate_credit_refund_cap() is
  'P5.7F: caps cumulative tenant_credit_refunds against exit_settlements.credit_origin_refundable '
  '— the credit-origin pool, structurally incapable of consulting or exceeding any deposit figure.';

create trigger trg_validate_credit_refund_cap
  before insert or update on kiraya.tenant_credit_refunds
  for each row execute function kiraya.validate_credit_refund_cap();
