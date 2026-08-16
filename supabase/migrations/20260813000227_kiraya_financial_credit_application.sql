-- ============================================================
-- KIRAYA
-- P1.3: tenant credit application
--
-- Applying tenant credit:
--
-- Existing tenant credit  = CREDIT
-- Applying credit         = DEBIT
--
-- The debit consumes the previously available credit.
-- The bill balance function separately counts this debit as
-- bill settlement.
-- ============================================================


create or replace function kiraya.apply_tenant_credit_to_bill(
    p_bill_id uuid,
    p_amount numeric,
    p_created_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_bill kiraya.bills%rowtype;

    v_credit numeric(18,2);
    v_bill_balance numeric(18,2);
    v_apply numeric(18,2);

    v_entry_id uuid;
begin

    if p_amount <= 0 then
        raise exception
            using
                errcode = '22003',
                message = 'Credit application amount must be greater than zero.';
    end if;


    select *
    into v_bill
    from kiraya.bills
    where id = p_bill_id
    for update;


    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Bill does not exist.';
    end if;


    if v_bill.status not in (
        'DRAFT',
        'FINALIZED'
    ) then
        raise exception
            using
                errcode = '23514',
                message = 'Credit cannot be applied to this bill status.';
    end if;


    v_credit :=
        kiraya.get_tenant_credit(
            v_bill.tenant_id
        );


    v_bill_balance :=
        kiraya.get_bill_balance(
            v_bill.id
        );


    v_apply :=
        least(
            p_amount,
            v_credit,
            v_bill_balance
        );


    if v_apply <= 0 then
        raise exception
            using
                errcode = '23514',
                message = 'No tenant credit is available to apply.';
    end if;


    insert into kiraya.ledger_entries (
        organization_id,
        tenant_id,
        lease_id,
        bill_id,
        entry_type,
        entry_date,
        description,
        debit_amount,
        credit_amount,
        currency_code,
        reference_code,
        created_by,
        metadata
    )
    values (
        v_bill.organization_id,
        v_bill.tenant_id,
        v_bill.lease_id,
        v_bill.id,
        'CREDIT_APPLICATION',
        current_date,
        'Tenant credit applied to bill '
            || v_bill.bill_number,
        v_apply,
        0,
        v_bill.currency_code,
        v_bill.bill_number,
        p_created_by,
        jsonb_build_object(
            'credit_applied',
            v_apply
        )
    )
    returning id into v_entry_id;


    return v_entry_id;
end;
$$;


comment on function kiraya.apply_tenant_credit_to_bill(
    uuid,
    numeric,
    uuid
) is
    'Consumes existing tenant credit and applies it toward a bill.';