-- Recover notification attempts left in `sending` when a worker exits before
-- recording the provider result. Existing retry timing and audit semantics
-- remain centralized in record_notification_attempt.

begin;

create or replace function public.recover_stale_notification_deliveries(p_limit integer default 50)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_delivery record;
  v_recovered integer := 0;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  for v_delivery in
    select id
    from public.notification_deliveries
    where status = 'sending'
      and attempted_at <= now() - interval '15 minutes'
    order by attempted_at, created_at
    limit least(greatest(coalesce(p_limit,50),1),100)
    for update skip locked
  loop
    perform public.record_notification_attempt(
      v_delivery.id, 'deferred', null, 'worker_timeout',
      'The notification worker did not finish this attempt.'
    );
    v_recovered := v_recovered + 1;
  end loop;
  return v_recovered;
end;
$$;

revoke all on function public.recover_stale_notification_deliveries(integer) from public, anon, authenticated;
grant execute on function public.recover_stale_notification_deliveries(integer) to service_role;

commit;
