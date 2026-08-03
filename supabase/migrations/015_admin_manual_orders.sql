-- Admin-entered orders for phone, WhatsApp, and in-person customers.
-- These are paid offline at creation time and can enter the normal vendor flow.

begin;

alter table public.orders
  alter column customer_id drop not null,
  add column if not exists entry_source text not null default 'customer';

alter table public.orders drop constraint if exists orders_entry_source_check;
alter table public.orders add constraint orders_entry_source_check
  check (entry_source in ('customer', 'admin_manual'));

alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check
  check (payment_provider in ('demo', 'hitpay', 'manual'));

alter table public.payment_transactions drop constraint if exists payment_transactions_provider_check;
alter table public.payment_transactions add constraint payment_transactions_provider_check
  check (provider in ('hitpay', 'manual'));

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
  p_completion_deadline timestamptz default null
) returns table(id uuid, reference text)
language plpgsql security definer set search_path = '' as $$
declare
  v_offering public.offerings%rowtype;
  v_order public.orders%rowtype;
  v_settings public.platform_settings%rowtype;
  v_quantity integer := coalesce(p_quantity, 1);
  v_amount integer;
  v_names text[] := coalesce(p_participant_names, '{}');
  v_reference text;
  v_payment_reference text := nullif(btrim(coalesce(p_payment_reference, '')), '');
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if p_offering_id is null then raise exception 'Choose a service package'; end if;
  if btrim(coalesce(p_customer_name, '')) = '' or char_length(btrim(p_customer_name)) > 120 then
    raise exception 'Enter a customer name of 120 characters or fewer';
  end if;
  if btrim(coalesce(p_customer_phone, '')) = '' or char_length(btrim(p_customer_phone)) > 25 then
    raise exception 'Enter a valid customer phone number';
  end if;
  if btrim(coalesce(p_customer_email, '')) !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(btrim(p_customer_email)) > 254 then
    raise exception 'Enter a valid customer email address';
  end if;
  if v_payment_reference is null or char_length(v_payment_reference) > 200 then
    raise exception 'Enter the offline payment reference';
  end if;
  if char_length(btrim(coalesce(p_dedication, ''))) > 300
    or char_length(btrim(coalesce(p_payment_method, ''))) > 80
    or char_length(btrim(coalesce(p_notes, ''))) > 2000
    or char_length(btrim(coalesce(p_beneficiary_country, ''))) > 100 then
    raise exception 'One or more job details are too long';
  end if;
  if p_completion_deadline is not null and p_completion_deadline <= now() then
    raise exception 'The completion deadline must be in the future';
  end if;

  select * into v_offering from public.offerings where id = p_offering_id and active;
  if not found then raise exception 'That service package is unavailable'; end if;
  select * into v_settings from public.platform_settings where id = true;
  if not found then raise exception 'Platform pricing is unavailable'; end if;

  if v_offering.service_type = 'korban' then
    if v_quantity not between 1 and 7 then raise exception 'Korban quantity must be between 1 and 7'; end if;
    if cardinality(v_names) <> v_quantity or exists (
      select 1 from unnest(v_names) as name
      where btrim(coalesce(name, '')) = '' or char_length(btrim(name)) > 120
    ) then raise exception 'Add one participant name for each Korban package'; end if;
    v_amount := v_offering.unit_amount * v_quantity;
  else
    if v_quantity <> 1 then raise exception 'Wakaf orders use a quantity of one'; end if;
    if p_total_amount is null or p_total_amount < v_offering.min_amount then
      raise exception 'The contribution is below the minimum package amount';
    end if;
    v_amount := p_total_amount;
    v_names := '{}';
  end if;

  v_reference := 'ASQ-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    reference, customer_id, offering_id, service_type, category_slug, quantity,
    participant_names, dedication, notes, customer_name, customer_phone, customer_email,
    unit_amount, total_amount, commission_rate_snapshot, commission_amount, vendor_payout_amount,
    payment_provider, payment_status, payment_reference, fulfilment_status, delivery_status,
    settlement_status, beneficiary_country, completion_deadline, currency, entry_source
  ) values (
    v_reference, null, v_offering.id, v_offering.service_type, v_offering.category_slug, v_quantity,
    v_names, nullif(btrim(coalesce(p_dedication, '')), ''), nullif(btrim(coalesce(p_notes, '')), ''),
    btrim(p_customer_name), btrim(p_customer_phone), lower(btrim(p_customer_email)),
    case when v_offering.service_type = 'korban' then v_offering.unit_amount else v_amount end,
    v_amount, v_settings.commission_rate, round(v_amount * v_settings.commission_rate),
    v_amount - round(v_amount * v_settings.commission_rate),
    'manual', 'paid', v_payment_reference, 'ready', 'not_ready', 'unpaid',
    nullif(btrim(coalesce(p_beneficiary_country, '')), ''), p_completion_deadline, 'SGD', 'admin_manual'
  ) returning * into v_order;

  insert into public.payment_transactions (
    order_id, provider, transaction_type, provider_request_id, provider_payment_id,
    amount, currency, status, provider_event_at, reason, requested_by, raw_payload
  ) values (
    v_order.id, 'manual', 'payment', 'manual:' || v_order.id::text, v_payment_reference,
    v_order.total_amount, 'SGD', 'succeeded', now(), nullif(btrim(coalesce(p_payment_method, '')), ''), auth.uid(),
    jsonb_build_object('entry_source', 'admin_manual', 'payment_method', nullif(btrim(coalesce(p_payment_method, '')), ''))
  );

  perform public.append_order_event(
    v_order.id, 'order.created_manually', 'admin.manual_entry', null,
    jsonb_build_object('payment_status', 'paid', 'fulfilment_status', 'ready'),
    jsonb_build_object('payment_reference', v_payment_reference, 'payment_method', nullif(btrim(coalesce(p_payment_method, '')), ''))
  );

  return query select v_order.id, v_order.reference;
end;
$$;

revoke all on function public.create_admin_manual_order(uuid, integer, integer, text, text, text, text[], text, text, text, text, text, timestamptz) from public;
grant execute on function public.create_admin_manual_order(uuid, integer, integer, text, text, text, text[], text, text, text, text, text, timestamptz) to authenticated;

commit;
