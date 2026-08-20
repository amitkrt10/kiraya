-- ============================================================
-- KIRAYA
-- Financial integrity: at most one authoritative bill per
-- lease + billing period
-- ============================================================
--
-- INVARIANT
--
-- For a given organization + lease + billing period
-- (period_start, period_end), there must never be more than one
-- non-VOID bill. A user retrying billing (or two billing runs
-- covering overlapping scope, e.g. one organization-wide run and
-- one property-scoped run for the same period) must not create
-- duplicate financial records.
--
-- WHY THE BILL TABLE, NOT BILLING_RUNS
--
-- kiraya.billing_runs is an execution container, not a financial
-- record — it only tracks counts/status of an attempt. The
-- financial record is kiraya.bills. Even if two billing_runs rows
-- are created for the same/overlapping scope and period (which
-- remains technically possible — see below), the invariant that
-- actually matters is that they can never together produce two
-- authoritative bills for the same lease/period. Enforcing this at
-- kiraya.bills is therefore both necessary and sufficient; a
-- constraint on kiraya.billing_runs would not be, since a
-- property-scoped run and an organization-wide run can legitimately
-- share the exact same period_start/period_end while covering
-- overlapping leases (kiraya.generate_billing_run's WHERE clause:
-- `p_property_id is null or u.property_id = p_property_id`), and
-- because kiraya.generate_bill() is independently callable outside
-- generate_billing_run() (p_billing_run_id defaults to NULL) — any
-- constraint scoped to billing_runs would not cover that path.
--
-- WHY billing_runs ITSELF IS LEFT WITHOUT A UNIQUENESS CONSTRAINT
--
-- Re-running billing for a period a second time is a legitimate,
-- already-supported retry pattern: generate_billing_run() always
-- creates a fresh run row (fresh run_code) and iterates leases
-- independently, catching each lease's failure without aborting the
-- others (existing `begin...exception when others...end` per-lease
-- block, logging BILL_GENERATION_FAILED to kiraya.audit_logs). A
-- second run over the same period will cleanly re-attempt leases
-- that failed the first time (e.g. a lease whose billing
-- configuration was missing and has since been added) while leases
-- that already have a bill for that period now fail gracefully
-- (via the constraint added below) instead of duplicating. So
-- duplicate *runs* are allowed by design; duplicate *bills* are not.
--
-- WHY VOID BILLS ARE EXCLUDED FROM THE UNIQUENESS KEY
--
-- kiraya.void_bill() never deletes a bill — it flips status to VOID
-- and posts REVERSAL ledger entries that net the original BILL
-- entries to zero (see 20260813000238_kiraya_financial_bill_void.sql).
-- kiraya.sync_bill_payment_status() explicitly skips VOID bills
-- (`if ... v_bill.status in ('DRAFT','VOID') then return`), and the
-- approved design system labels VOID "Cancelled — excluded from
-- totals". A VOID bill is therefore a fully-reversed, non-authoritative
-- record for its period — the same "terminal status frees the slot"
-- pattern already used for CANCELLED leases in
-- kiraya.validate_lease_overlap() (P5.2C). A bill voided in error
-- must be re-generatable for the same lease/period; a partial unique
-- index (`where status <> 'VOID'`) allows exactly that while still
-- preventing two simultaneously-live bills for the same lease/period.
--
-- property_id is intentionally NOT part of the key: a bill always
-- belongs to exactly one lease, which belongs to exactly one
-- unit/property — property scope is already fully determined by
-- lease_id, so adding it (or a sentinel value for the org-wide case)
-- would be redundant, not an independent axis of uniqueness.
--
-- Verified before adding this constraint: kiraya.bills currently has
-- 0 rows in the live project — no existing duplicates to reconcile.
-- ============================================================

create unique index bills_lease_period_unique_idx
    on kiraya.bills (organization_id, lease_id, period_start, period_end)
    where status <> 'VOID';

comment on index kiraya.bills_lease_period_unique_idx is
    'At most one non-VOID bill per lease per billing period. VOID bills are excluded (fully reversed via ledger REVERSAL entries, never authoritative), so a bill voided in error can be regenerated for the same period.';


-- ------------------------------------------------------------
-- generate_bill(): catch the new constraint and raise a clear,
-- specific business error instead of letting a raw unique-violation
-- (naming an internal index) escape, and instead of silently
-- creating a second bill. This is a per-lease failure inside
-- generate_billing_run()'s existing exception-catching loop — it
-- does not abort the run, it surfaces as one lease's failure reason
-- in kiraya.audit_logs, exactly like any other per-lease
-- generation failure (e.g. "No active billing configuration found
-- for lease.").
--
-- Nothing else about this function changes — the body below is
-- byte-for-byte identical to the version in
-- 20260813000170_kiraya_generate_bill.sql except for the added
-- begin/exception block around the bills insert.
-- ------------------------------------------------------------

create or replace function kiraya.generate_bill(p_lease_id uuid, p_period_start date, p_period_end date, p_bill_date date, p_due_date date DEFAULT NULL::date, p_billing_run_id uuid DEFAULT NULL::uuid, p_created_by uuid DEFAULT NULL::uuid)
 returns uuid
 language plpgsql
 SET search_path TO 'kiraya', 'public'
as $function$
declare
    v_lease kiraya.leases%rowtype;

    v_bill_id uuid;

    v_bill_number text;

    v_previous_balance numeric(18,2);

    v_subtotal numeric(18,2);

    v_total numeric(18,2);

    v_constraint text;
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
    --
    -- One non-VOID bill per (organization_id, lease_id,
    -- period_start, period_end) is enforced by
    -- bills_lease_period_unique_idx — catch that specific
    -- violation and raise a clear business error rather than
    -- letting a second bill silently get created or a raw
    -- constraint-name error escape.
    -- --------------------------------------------------------

    begin

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

    exception
        when unique_violation then

            get stacked diagnostics v_constraint = constraint_name;

            if v_constraint = 'bills_lease_period_unique_idx' then
                raise exception
                    using
                        errcode = '23505',
                        message = 'Bill already exists for this lease and billing period.';
            else
                raise;
            end if;

    end;


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
$function$
;
