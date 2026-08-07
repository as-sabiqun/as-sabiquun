-- Capture the full beneficiary and dedication record when an administrator
-- enters a paid phone, WhatsApp, or in-person order.

begin;

alter function public.create_admin_manual_order(
  uuid, integer, integer, text, text, text, text[], text, text, text,
  text, text, timestamptz
) rename to create_admin_manual_order_core;

revoke all on function public.create_admin_manual_order_core(
  uuid, integer, integer, text, text, text, text[], text, text, text,
  text, text, timestamptz
) from public, anon, authenticated;

create or replace function public.create_admin_manual_order(
  p_offering_id uuid,
  p_quantity integer,
  p_total_amount integer,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_participant_names text[] default '{}',
  p_dedication text default null,
  p_payment_reference text default null,
  p_payment_method text default null,
  p_notes text default null,
  p_beneficiary_country text default null,
  p_completion_deadline timestamptz default null,
  p_beneficiary_state text default null,
  p_beneficiary_village text default null,
  p_partner_organisation text default null,
  p_beneficiary_names text[] default '{}',
  p_dedication_arabic text default null,
  p_dedication_remarks text default null
) returns table(id uuid, reference text)
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_reference text;
begin
  select created.id, created.reference into v_id, v_reference
  from public.create_admin_manual_order_core(
    p_offering_id,
    p_quantity,
    p_total_amount,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_participant_names,
    p_dedication,
    p_payment_reference,
    p_payment_method,
    p_notes,
    p_beneficiary_country,
    p_completion_deadline
  ) created;

  perform public.update_order_record_details(
    v_id,
    p_beneficiary_country,
    p_beneficiary_state,
    p_beneficiary_village,
    p_partner_organisation,
    p_beneficiary_names,
    p_dedication_arabic,
    p_dedication_remarks
  );

  return query select v_id, v_reference;
end;
$$;

revoke all on function public.create_admin_manual_order(
  uuid, integer, integer, text, text, text, text[], text, text, text,
  text, text, timestamptz, text, text, text, text[], text, text
) from public;
grant execute on function public.create_admin_manual_order(
  uuid, integer, integer, text, text, text, text[], text, text, text,
  text, text, timestamptz, text, text, text, text[], text, text
) to authenticated;

commit;
