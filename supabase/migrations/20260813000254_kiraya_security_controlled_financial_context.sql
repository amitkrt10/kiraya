-- ============================================================
-- KIRAYA
-- P2.16: controlled financial mutation context
--
-- Controlled SECURITY DEFINER financial functions can establish
-- a transaction-local marker.
--
-- Direct application UPDATE statements cannot establish this
-- marker safely.
-- ============================================================


create or replace function kiraya.require_financial_context()
returns void
language plpgsql
security definer
set search_path = kiraya, public
set row_security = off
as $$
begin

    if coalesce(
        current_setting(
            'kiraya.financial_context',
            true
        ),
        ''
    ) <> '1' then

        raise exception
            using
                errcode = '42501',
                message = 'Financial mutation must be performed through an authorized Kiraya financial function.';
    end if;

end;
$$;