-- Production setup template. Run this in the Supabase SQL editor only after:
--   1. pg_cron and pg_net are enabled.
--   2. Vault contains non-empty secrets named:
--        as_sabiqun_site_url
--        as_sabiqun_internal_cron_secret
--
-- Do not paste either value into this file or into cron.job. The second Vault
-- value must exactly match Vercel's INTERNAL_CRON_SECRET.

do $$
declare
  v_missing text;
  v_site_url text;
  v_cron_secret text;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable the pg_cron extension before scheduling production jobs';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'Enable the pg_net extension before scheduling production jobs';
  end if;
  if to_regclass('vault.decrypted_secrets') is null then
    raise exception 'Supabase Vault is not available';
  end if;

  select string_agg(required.name, ', ' order by required.name)
  into v_missing
  from (
    values
      ('as_sabiqun_site_url'),
      ('as_sabiqun_internal_cron_secret')
  ) as required(name)
  where not exists (
    select 1
    from vault.decrypted_secrets secret
    where secret.name = required.name
      and btrim(secret.decrypted_secret) <> ''
  );

  if v_missing is not null then
    raise exception 'Create non-empty Vault entries before scheduling: %', v_missing;
  end if;

  select decrypted_secret into v_site_url
  from vault.decrypted_secrets where name = 'as_sabiqun_site_url';
  select decrypted_secret into v_cron_secret
  from vault.decrypted_secrets where name = 'as_sabiqun_internal_cron_secret';

  if btrim(v_site_url) !~ '^https://[^/?#]+/?$' then
    raise exception 'as_sabiqun_site_url must be an HTTPS origin with no path, query, or fragment';
  end if;
  if char_length(v_cron_secret) < 32 then
    raise exception 'as_sabiqun_internal_cron_secret must contain at least 32 characters';
  end if;
end;
$$;

select cron.schedule(
  'as-sabiqun-production-operations',
  '* * * * *',
  $job$
    select net.http_post(
      url := (
        select rtrim(btrim(decrypted_secret), '/') || '/api/internal/process-notifications'
        from vault.decrypted_secrets
        where name = 'as_sabiqun_site_url'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'as_sabiqun_internal_cron_secret'
        )
      ),
      body := jsonb_build_object('source', 'supabase-cron'),
      timeout_milliseconds := 55000
    );
  $job$
);

-- Re-running cron.schedule with this job name updates the existing job.
-- To disable it intentionally:
-- select cron.unschedule('as-sabiqun-production-operations');
