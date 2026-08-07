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
select set_config('request.jwt.claims','{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2","amr":[{"method":"password"},{"method":"totp"}]}',true);
update public.offerings set unit_amount = 28100 where slug = 'korban-share';

do $$ begin
  if (select unit_amount from public.offerings where slug = 'korban-share') <> 28100 then
    raise exception 'Administrator could not change catalog pricing';
  end if;
end $$;

rollback;
