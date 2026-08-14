-- ============================================================
-- KIRAYA
-- Migration: exit settlement calculation
--
-- Purpose:
-- Calculates the final amount payable/refundable when a tenant
-- exits.
--
-- Formula:
--
-- Tenant owes:
--
--   previous dues
-- + final charges
-- - tenant credits
-- - deposit deductions
--
-- If result > 0:
--   tenant pays Kiraya/client.
--
-- If result < 0:
--   tenant receives refund.
--
-- The security deposit itself is not automatically refunded
-- here. The actual refund is a separate transaction.
-- ============================================================

create or replace function kiraya.calculate_exit_settlement(
    p_exit_settlement_id uuid
)
returns kiraya.exit_settlements
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_settlement kiraya.exit_settlements%rowtype;

    v_previous_dues numeric(18,2);
    v_final_charges numeric(18,2);
    v_deposit_deduction numeric(18,2);
    v_credit numeric(18,2);

    v_net numeric(18,2);
begin

    select *
    into v_settlement
    from kiraya.exit_settlements
    where id = p_exit_settlement_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Exit settlement does not exist.';
    end if;


    /*
     * Previous ledger due.
     */
    v_previous_dues :=
        kiraya.get_tenant_due(
            v_settlement.tenant_id
        );


    /*
     * Exit-specific charges.
     */
    select coalesce(
        sum(
            case
                when is_credit = false
                    then amount
                else 0
            end
        ),
        0
    )
    into v_final_charges
    from kiraya.exit_settlement_items
    where exit_settlement_id = p_exit_settlement_id
      and item_type <> 'PREVIOUS_DUE'
      and item_type <> 'DEPOSIT_DEDUCTION';


    /*
     * Tenant credit.
     */
    v_credit :=
        kiraya.get_tenant_credit(
            v_settlement.tenant_id
        );


    /*
     * Deposit deductions.
     */
    select coalesce(
        sum(amount),
        0
    )
    into v_deposit_deduction
    from kiraya.exit_settlement_items
    where exit_settlement_id = p_exit_settlement_id
      and item_type = 'DEPOSIT_DEDUCTION';


    v_net :=
        v_previous_dues
        + v_final_charges
        - v_credit
        - v_deposit_deduction;


    if v_net >= 0 then

        update kiraya.exit_settlements
        set
            previous_dues = v_previous_dues,
            final_charges = v_final_charges,
            deposit_deduction = v_deposit_deduction,
            tenant_credit = v_credit,
            final_amount_due = round(v_net, 2),
            final_amount_refundable = 0,
            updated_at = now()
        where id = p_exit_settlement_id
        returning * into v_settlement;

    else

        update kiraya.exit_settlements
        set
            previous_dues = v_previous_dues,
            final_charges = v_final_charges,
            deposit_deduction = v_deposit_deduction,
            tenant_credit = v_credit,
            final_amount_due = 0,
            final_amount_refundable = round(abs(v_net), 2),
            updated_at = now()
        where id = p_exit_settlement_id
        returning * into v_settlement;

    end if;


    return v_settlement;
end;
$$;


comment on function kiraya.calculate_exit_settlement(uuid) is
    'Calculates final tenant payable/refundable amount for an exit settlement.';