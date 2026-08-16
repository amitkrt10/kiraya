-- ============================================================
-- KIRAYA
-- P2 repair: controlled bill void authorization
-- ============================================================

create or replace function kiraya.void_bill(
    p_bill_id uuid,p_voided_by uuid,p_reason text
)
returns kiraya.bills
language plpgsql security definer
set search_path=kiraya,public
set row_security=off
as $$
declare v_bill kiraya.bills%rowtype;
begin
    select * into v_bill from kiraya.bills where id=p_bill_id for update;
    if not found then raise exception using errcode='23503',message='Bill does not exist.'; end if;
    if not kiraya.can_write_organization(v_bill.organization_id) then raise exception using errcode='42501',message='Not authorized to void bills in this organization.'; end if;
    perform set_config('kiraya.financial_context','1',true);
    return kiraya.void_bill(p_bill_id,p_voided_by,p_reason);
end;
$$;

revoke all on function kiraya.void_bill(uuid,uuid,text) from public;
grant execute on function kiraya.void_bill(uuid,uuid,text) to authenticated;
