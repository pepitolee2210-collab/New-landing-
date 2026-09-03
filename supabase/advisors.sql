-- ============================================================
-- UsaLatinoPrime — Asesoras y reparto de leads por WhatsApp
-- Ya aplicado en el proyecto de Supabase (migraciones
-- ulp_advisors_and_leads y ulp_advisors_round_robin). Se deja aquí
-- como registro y para recrear el esquema en otro proyecto.
-- Requiere supabase/setup.sql (tabla ulp_admin_config con el secreto).
--
-- Diseño:
--  · ulp_advisors: quién atiende (nombre, WhatsApp, activa) + contador de
--    turnos. El público solo lee las activas (RLS).
--  · ulp_leads: cada clic a WhatsApp con asesora asignada. source='auto'
--    es la primera vez que la persona escribe (cuenta como lead);
--    'sticky' es la misma persona volviendo a tocar (no cuenta).
--  · ulp_assign_advisor(): asigna por TURNO ESTRICTO (menos leads primero,
--    en empate la que lleva más tiempo sin recibir) con bloqueo de fila.
--  · Moderación con el secreto de admin, como las reseñas.
-- ============================================================

create table if not exists public.ulp_advisors (
  id               text primary key check (id ~ '^[a-z0-9-]{2,30}$'),
  name             text not null check (char_length(name) between 2 and 60),
  whatsapp         text not null check (whatsapp ~ '^[0-9]{8,15}$'),
  weight           int  not null default 1 check (weight between 0 and 100),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  assigned_count   int not null default 0,
  last_assigned_at timestamptz
);
alter table public.ulp_advisors enable row level security;

drop policy if exists "ulp_advisors_select_active" on public.ulp_advisors;
create policy "ulp_advisors_select_active" on public.ulp_advisors
  for select to anon using (active);

insert into public.ulp_advisors (id, name, whatsapp) values
  ('vanessa', 'Vanessa', '17633422258'),
  ('jazmin',  'Jazmín',  '18083018276')
on conflict (id) do nothing;

create table if not exists public.ulp_leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  advisor_id text not null references public.ulp_advisors(id),
  kind       text not null check (kind in ('whatsapp','prime_chat','prime_call','cita','urgente')),
  path       text check (char_length(path) <= 200),
  service_id text check (char_length(service_id) <= 40),
  source     text check (source in ('auto','sticky','default'))
);
alter table public.ulp_leads enable row level security;
create index if not exists ulp_leads_advisor_created_idx on public.ulp_leads (advisor_id, created_at desc);
create index if not exists ulp_leads_created_idx on public.ulp_leads (created_at desc);

drop policy if exists "ulp_leads_insert_public" on public.ulp_leads;
create policy "ulp_leads_insert_public" on public.ulp_leads
  for insert to anon with check (true);

create or replace function public.ulp_assign_advisor()
returns table (id text, name text, whatsapp text)
language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  select a.id into v_id
    from public.ulp_advisors a
    where a.active
    order by a.assigned_count asc, a.last_assigned_at asc nulls first, a.created_at asc
    limit 1
    for update;
  if v_id is null then return; end if;
  update public.ulp_advisors a
     set assigned_count = a.assigned_count + 1, last_assigned_at = now()
   where a.id = v_id;
  return query select a.id, a.name, a.whatsapp from public.ulp_advisors a where a.id = v_id;
end; $$;
grant execute on function public.ulp_assign_advisor() to anon;

create or replace function public.ulp_admin_advisors_list(p_secret text)
returns setof public.ulp_advisors
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ulp_admin_config where admin_secret = p_secret) then
    raise exception 'unauthorized';
  end if;
  return query select a.* from public.ulp_advisors a order by a.created_at;
end; $$;

create or replace function public.ulp_admin_advisor_upsert(
  p_secret text, p_id text, p_name text, p_whatsapp text, p_weight int, p_active boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ulp_admin_config where admin_secret = p_secret) then
    raise exception 'unauthorized';
  end if;
  insert into public.ulp_advisors (id, name, whatsapp, weight, active)
  values (p_id, p_name, p_whatsapp, p_weight, p_active)
  on conflict (id) do update
    set name = excluded.name, whatsapp = excluded.whatsapp,
        weight = excluded.weight, active = excluded.active, updated_at = now();
end; $$;

create or replace function public.ulp_admin_advisors_reset(p_secret text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ulp_admin_config where admin_secret = p_secret) then
    raise exception 'unauthorized';
  end if;
  update public.ulp_advisors set assigned_count = 0, last_assigned_at = null;
end; $$;

create or replace function public.ulp_admin_leads_list(p_secret text, p_days int default 30, p_limit int default 500)
returns setof public.ulp_leads
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ulp_admin_config where admin_secret = p_secret) then
    raise exception 'unauthorized';
  end if;
  return query
    select l.* from public.ulp_leads l
    where l.created_at >= now() - make_interval(days => greatest(1, least(p_days, 365)))
    order by l.created_at desc
    limit greatest(1, least(p_limit, 2000));
end; $$;

grant execute on function public.ulp_admin_advisors_list(text) to anon;
grant execute on function public.ulp_admin_advisor_upsert(text, text, text, text, int, boolean) to anon;
grant execute on function public.ulp_admin_advisors_reset(text) to anon;
grant execute on function public.ulp_admin_leads_list(text, int, int) to anon;
