-- ============================================================
-- KIRAYA
-- Migration: generate bill
--
-- Purpose:
-- Atomically creates a complete draft bill:
--
--   1. Previous tenant balance
--   2. Rent
--   3. Utilities
--   4. Total
--
-- The bill remains DRAFT until explicitly finalized.
--
-- No ledger entry is created while the bill is DRAFT.
-- ============================================================

create or replace function kiraya.generate_bill(
    p_lease_id uuid,
    p_period_start date,
    p_period_end date,
    p_bill_date date,
    p_due_date date default null,
    p_billing_run_id uuid default null,
    p_created_by uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = kiraya, public
as $$
declare
    v_lease kiraya.leases%rowtype;

    v_bill_id uuid;

    v_bill_number text;

    v_previous_balance numeric(18,2);

    v_subtotal numeric(18,2);

    v_total numeric(18,2);
begin

    -- --------------------------------------------------------
    -- Validate period.
    -- --------------------------------------------------------

    if p_period_end < p_period_start then
        raise exception
            using
                errcode = '22007',
                message = 'Billing period end date cannot be before start date.';
    end if;


    -- --------------------------------------------------------
    -- Load lease.
    -- --------------------------------------------------------

    select *
    into v_lease
    from kiraya.leases
    where id = p_lease_id
    for update;

    if not found then
        raise exception
            using
                errcode = '23503',
                message = 'Lease does not exist.';
    end if;


    -- --------------------------------------------------------
    -- Prevent bills outside the lease occupancy period.
    -- --------------------------------------------------------

    if p_period_end < v_lease.occupancy_start_date then
        raise exception
            using
                errcode = '23514',
                message = 'Billing period occurs before tenant occupancy.';
    end if;


    if v_lease.actual_end_date is not null
       and p_period_start > v_lease.actual_end_date then

        raise exception
            using
                errcode = '23514',
                message = 'Billing period occurs after tenant exit.';
    end if;


    -- --------------------------------------------------------
    -- Generate bill number.
    --
    -- Final uniqueness is protected by the database index.
    -- --------------------------------------------------------

    v_bill_number :=
        'INV-'
        || to_char(p_bill_date, 'YYYYMMDD')
        || '-'
        || upper(substr(
            replace(gen_random_uuid()::text, '-', ''),
            1,
            8
        ));


    -- --------------------------------------------------------
    -- Previous tenant balance.
    --
    -- Positive tenant balance = amount due.
    --
    -- Negative tenant balance = tenant credit.
    --
    -- We only bring a positive due into the new bill.
    -- Credit remains in the ledger and can be consumed through
    -- payment allocation/business logic.
    -- --------------------------------------------------------

    v_previous_balance :=
        kiraya.get_tenant_due(v_lease.tenant_id);


    -- --------------------------------------------------------
    -- Create draft bill.
    -- --------------------------------------------------------

    insert into kiraya.bills (
        organization_id,
        billing_run_id,
        lease_id,
        tenant_id,
        unit_id,
        bill_number,
        period_start,
        period_end,
        bill_date,
        due_date,
        status,
        previous_balance_amount,
        currency_code,
        created_at,
        updated_at
    )
    values (
        v_lease.organization_id,
        p_billing_run_id,
        v_lease.id,
        v_lease.tenant_id,
        v_lease.unit_id,
        v_bill_number,
        p_period_start,
        p_period_end,
        p_bill_date,
        p_due_date,
        'DRAFT',
        v_previous_balance,
        'INR',
        now(),
        now()
    )
    returning id into v_bill_id;


    -- --------------------------------------------------------
    -- Previous due line.
    -- --------------------------------------------------------

    if v_previous_balance > 0 then

        insert into kiraya.bill_items (
            organization_id,
            bill_id,
            item_type,
            description,
            quantity,
            unit_name,
            unit_rate,
            amount,
            metadata
        )
        values (
            v_lease.organization_id,
            v_bill_id,
            'PREVIOUS_DUE',
            'Previous outstanding balance',
            1,
            'balance',
            v_previous_balance,
            v_previous_balance,
            jsonb_build_object(
                'tenant_balance_before_bill',
                v_previous_balance
            )
        );

    end if;


    -- --------------------------------------------------------
    -- Rent.
    -- --------------------------------------------------------

    perform kiraya.generate_rent_bill_item(
        v_bill_id,
        v_lease.id,
        p_period_start,
        p_period_end
    );


    -- --------------------------------------------------------
    -- Utilities.
    -- --------------------------------------------------------

    perform kiraya.generate_utility_bill_items(
        v_bill_id,
        v_lease.id,
        p_period_start,
        p_period_end
    );


    -- --------------------------------------------------------
    -- Calculate subtotal.
    -- --------------------------------------------------------

    select coalesce(
        sum(amount),
        0
    )
    into v_subtotal
    from kiraya.bill_items
    where bill_id = v_bill_id;


    v_total := round(v_subtotal, 2);


    -- --------------------------------------------------------
    -- Update bill totals.
    -- --------------------------------------------------------

    update kiraya.bills
    set
        subtotal = v_subtotal,
        total_amount = v_total,
        updated_at = now()
    where id = v_bill_id;


    return v_bill_id;
end;
$$;


comment on function kiraya.generate_bill(
    uuid,
    date,
    date,
    date,
    date,
    uuid,
    uuid
) is
    'Creates a draft tenant bill containing previous dues, rent and utility charges.';