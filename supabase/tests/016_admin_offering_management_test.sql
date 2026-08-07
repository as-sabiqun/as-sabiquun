-- Run after all migrations with a privileged local test connection.
begin;

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
values
  ('16000000-0000-4000-8000-000000000001','catalog-operations@example.test',now(),'{}','{"provider":"email","providers":["email"]}'),
  ('16000000-0000-4000-8000-000000000002','catalog-admin@example.test',now(),'{}','{"provider":"email","providers":["email"]}');

select set_config('request.jwt.claims','{"role":"service_role"}',true);
update public.profiles set role = 'admin', status = 'active', admin_access_level = 'operations'
where id = '16000000-0000-4000-8000-000000000001';
update public.profiles set role = 'admin', status = 'active', admin_access_level = 'administrator'
where id = '16000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2","amr":[{"method":"password"},{"method":"totp"}]}',true);
update public.offerings set unit_amount = 28100 where slug = 'korban-share';

do $$ begin
  if (select unit_amount from public.offerings where slug = 'korban-share') <> 28000 then
    raise exception 'Operations staff changed catalog pricing';
  end if;
end $$;

select set_config('request.jwt.claim.sub','16000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1","amr":[{"method":"password"}]}',true);
update public.offerings set unit_amount = 28100 where slug = 'korban-share';

do $$ begin
  if (select unit_amount from public.offerings where slug = 'korban-share') <> 28000 then
    raise exception 'AAL1 administrator changed catalog pricing';
  end if;
end $$;

select set_config('request.jwt.claims','{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2","amr":[{"method":"password"},{"method":"totp"}]}',true);
update public.offerings set unit_amount = 28100 where slug = 'korban-share';

do $$ begin
  if (select unit_amount from public.offerings where slug = 'korban-share') <> 28100 then
    raise exception 'Administrator could not change catalog pricing';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from public.offering_catalog_events
    where offering_id = (select id from public.offerings where slug = 'korban-share')
      and event_type = 'offering.updated'
      and actor_id = '16000000-0000-4000-8000-000000000002'
      and (previous_state->>'unit_amount')::integer = 28000
      and (new_state->>'unit_amount')::integer = 28100
  ) then raise exception 'Catalog price change was not audited'; end if;
end $$;

delete from public.offerings where slug = 'korban-share';
do $$ begin
  if not exists (select 1 from public.offerings where slug = 'korban-share') then
    raise exception 'Administrator deleted a catalog offering';
  end if;
end $$;

do $$ begin
  begin
    update public.offerings set unit_amount = 100000001 where slug = 'korban-share';
    raise exception 'Database accepted a price above the accounting ceiling';
  exception when check_violation then null;
  end;
end $$;

rollback;
