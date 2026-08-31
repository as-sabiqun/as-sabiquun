begin;

alter table public.offerings
  drop constraint if exists offerings_pricing_shape_check;
alter table public.offerings
  add constraint offerings_pricing_shape_check check (
    (service_type = 'korban' and category_slug = 'korban' and unit_amount is not null and min_amount is null)
    or
    (service_type = 'wakaf' and category_slug in ('water', 'quran', 'orphans') and unit_amount is null and min_amount is not null)
  );

drop policy if exists "offerings admin write" on public.offerings;
drop policy if exists "offerings administrator write" on public.offerings;
create policy "offerings administrator write" on public.offerings
  for all to authenticated
  using (public.admin_access_at_least('administrator'))
  with check (public.admin_access_at_least('administrator'));

commit;
